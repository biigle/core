<script>
import FilterTab from './components/filterTab';
import ImageGrid from './components/volumeImageGrid';
import ImagesStore from './stores/image';
import LabelsTab from './components/labelsTab';
import SortingTab from './components/sortingTab';
import VolumesApi from './api/volumes';
import {LoaderMixin} from './import';
import {Settings} from './import';
import {SidebarTab} from './import';
import {Sidebar} from './import';
import {UrlParams} from './import';

let transformUuid = function (uuid) {
    return uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid;
};

/**
 * View model for the main volume container
 */

/*
 * ABOUT PERFORMANCE
 *
 * Calling this.xxx on a Vue model inside a for loop is very slow because each call
 * must pass through the reactive getter functions! To mitigate this we use the
 * forEach method or set local variables wherever we can.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        sidebar: Sidebar,
        sidebarTab: SidebarTab,
        imageGrid: ImageGrid,
        filterTab: FilterTab,
        sortingTab: SortingTab,
        labelsTab: LabelsTab,
    },
    data() {
        return {
            imageIds: [],
            images: [],
            filterSequence: [],
            filterMode: null,
            filterActive: false,
            sortingSequence: [],
            sortingActive: false,
            volumeId: null,
            imageLabelMode: false,
            selectedLabel: null,
            loadingFilenames: false,
            showFilenames: false,
            filenamesPromise: null,
            loadingLabels: false,
            showLabels: false,
            labelsPromise: null,
            settings: null,
        };
    },
    computed: {
        // Map from image ID to index of sorted array to compute sortedImages fast.
        sortingMap() {
            let map = {};
            this.sortingSequence.forEach(function (value, index) {
                map[value] = index;
            });

            return map;
        },
        sortedImages() {
            // Create new array where each image is at its sorted index.
            let map = this.sortingMap;
            let images = [];
            this.images.forEach(function (image) {
                images[map[image.id]] = image;
            });

            return images;
        },
        // Datastructure to make the filtering in imagesToShow more performant.
        filterMap() {
            let map = {};
            this.filterSequence.forEach(function (i) {
                map[i] = null;
            });

            return map;
        },
        imagesToShow() {
            let map = this.filterMap;

            if (this.filterMode === 'flag') {
                return this.sortedImages.map(function (image) {
                    image.flagged = map.hasOwnProperty(image.id);

                    return image;
                });
            }

            return this.sortedImages.filter(function (image) {
                image.flagged = false;

                return map.hasOwnProperty(image.id);
            });
        },
        imageIdsToShow() {
            return this.imagesToShow.map((image) => image.id);
        },
        imagesStorageKey() {
            return `biigle.volumes.${this.volumeId}.images`;
        },
        offsetStorageKey() {
            return `biigle.volumes.${this.volumeId}.offset`;
        },
        initialOffset() {
            return parseInt(UrlParams.get('offset')) ||
                parseInt(localStorage.getItem(this.offsetStorageKey)) ||
                0;
        },
        filterEmpty() {
            return this.filterActive && this.filterSequence.length === 0;
        },
    },
    methods: {
        handleSidebarToggle() {
            this.$nextTick(() => this.$refs.imageGrid.$emit('resize'));
        },
        handleSidebarOpen(tab) {
            this.imageLabelMode = tab === 'labels';
        },
        handleSidebarClose() {
            this.imageLabelMode = false;
        },
        toggleLoading(loading) {
            if (loading) {
                this.startLoading();
            } else {
                this.finishLoading();
            }
        },
        updateFilterSequence(sequence, mode, active) {
            this.filterSequence = sequence;
            this.filterMode = mode;
            this.filterActive = active;
        },
        handleImageGridScroll(offset) {
            if (offset > 0) {
                UrlParams.set({offset: offset});
                localStorage.setItem(this.offsetStorageKey, offset);
            } else {
                UrlParams.unset('offset');
                localStorage.removeItem(this.offsetStorageKey);
            }
        },
        handleSelectedLabel(label) {
            this.selectedLabel = label;
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
        },
        updateSortingSequence(sequence, active) {
            this.sortingSequence = sequence;
            this.sortingActive = active;
        },
        enableFilenames() {
            if (!this.filenamesPromise) {
                this.loadingFilenames = true;
                this.filenamesPromise = VolumesApi.queryFilenames({id: this.volumeId})
                    .then(this.setFilenames)
                    .finally(() => this.loadingFilenames = false);
            }

            this.filenamesPromise.then(() => this.showFilenames = true);
        },
        disableFilenames() {
            this.showFilenames = false;
        },
        setFilenames(response) {
            this.images.forEach(function (image) {
                image.filename = response.body[image.id];
            });
        },
        enableLabels() {
            if (!this.labelsPromise) {
                this.loadingLabels = true;
                this.labelsPromise = VolumesApi.queryImageLabels({id: this.volumeId})
                    .then(this.setLabels)
                    .finally(() => this.loadingLabels = false);
            }

            this.labelsPromise.then(() => this.showLabels = true);
        },
        disableLabels() {
            this.showLabels = false;
        },
        setLabels(response) {
            this.images.forEach(function (image) {
                image.labels = response.body[image.id];
            });
        },
        restoreSettings() {
            if (this.settings.get('showFilenames') === true) {
                this.enableFilenames();
            }

            if (this.settings.get('showLabels') === true) {
                this.enableLabels();
            }
        },
    },
    watch: {
        imageIdsToShow(imageIdsToShow) {
            // If the shown images differ from the default sequence, store them for
            // the annotation tool.
            let imageIds = this.imageIds;
            let equal = imageIdsToShow.length === imageIds.length;

            if (equal) {
                for (let i = imageIdsToShow.length - 1; i >= 0; i--) {
                    if (imageIdsToShow[i] !== imageIds[i]) {
                        equal = false;
                        break;
                    }
                }
            }

            if (equal) {
                localStorage.removeItem(this.imagesStorageKey);
            } else {
                localStorage.setItem(
                    this.imagesStorageKey,
                    JSON.stringify(imageIdsToShow)
                );
            }

            ImagesStore.count = imageIdsToShow.length;
        },
        showFilenames(show) {
            this.settings.set('showFilenames', show);
        },
        showLabels(show) {
            this.settings.set('showLabels', show);
        },
    },
    created() {
        let imageUuids = biigle.$require('volumes.imageUuids');
        let thumbUri = biigle.$require('volumes.thumbUri');
        let annotateUri = biigle.$require('volumes.annotateUri');
        let imageUri = biigle.$require('volumes.imageUri');

        this.imageIds = biigle.$require('volumes.imageIds');
        this.filterSequence = this.imageIds;
        this.sortingSequence = this.imageIds;
        this.volumeId = biigle.$require('volumes.volumeId');
        this.settings = new Settings({
            data: {
                storageKey: 'biigle.volumes.settings',
                defaults: {
                    showFilenames: false,
                    showLabels: false,
                },
            },
        });

        // Do this here instead of a computed property so the image objects get
        // reactive. Also, this array does never change between page reloads.
        this.images = this.imageIds.map(function (id) {
            return {
                id: id,
                url: thumbUri.replace(':uuid', transformUuid(imageUuids[id])),
                annotateUrl: annotateUri.replace(':id', id),
                imageUrl: imageUri.replace(':id', id),
                flagged: false,
                filename: null,
                labels: [],
            };
        });

        this.restoreSettings();
    },
};
</script>
