<script>
import FilterTab from './components/filterTab';
import ImageGrid from './components/volumeImageGrid';
import FilesStore from './stores/files';
import LabelsTab from './components/labelsTab';
import LoaderMixin from '../core/mixins/loader';
import Settings from '../core/models/Settings';
import Sidebar from '../core/components/sidebar';
import SidebarTab from '../core/components/sidebarTab';
import SortingTab from './components/sortingTab';
import VolumesApi from './api/volumes';
import {urlParams as UrlParams} from '../core/utils';

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
            fileIds: [],
            files: [],
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
            type: null,
        };
    },
    computed: {
        // Map from file ID to index of sorted array to compute sortedFiles fast.
        sortingMap() {
            let map = {};
            this.sortingSequence.forEach(function (value, index) {
                map[value] = index;
            });

            return map;
        },
        sortedFiles() {
            // Create new array where each file is at its sorted index.
            let map = this.sortingMap;
            let files = [];
            this.files.forEach(function (file) {
                files[map[file.id]] = file;
            });

            return files;
        },
        // Datastructure to make the filtering in filesToShow more performant.
        filterMap() {
            let map = {};
            this.filterSequence.forEach(function (i) {
                map[i] = null;
            });

            return map;
        },
        filesToShow() {
            let map = this.filterMap;

            if (this.filterMode === 'flag') {
                return this.sortedFiles.map(function (file) {
                    file.flagged = map.hasOwnProperty(file.id);

                    return file;
                });
            }

            return this.sortedFiles.filter(function (file) {
                file.flagged = false;

                return map.hasOwnProperty(file.id);
            });
        },
        fileIdsToShow() {
            return this.filesToShow.map((file) => file.id);
        },
        filesStorageKey() {
            return `biigle.volumes.${this.volumeId}.files`;
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
            return this.filterActive && this.filterMode !== 'flag' && this.filterSequence.length === 0;
        },
        noContent() {
            return !this.loading && this.files.length === 0;
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
        handleScroll(offset) {
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
            this.files.forEach(function (file) {
                file.filename = response.body[file.id];
            });
        },
        enableLabels() {
            if (!this.labelsPromise) {
                this.loadingLabels = true;
                this.labelsPromise = VolumesApi.queryFileLabels({id: this.volumeId})
                    .then(this.setLabels)
                    .finally(() => this.loadingLabels = false);
            }

            this.labelsPromise.then(() => this.showLabels = true);
        },
        disableLabels() {
            this.showLabels = false;
        },
        setLabels(response) {
            this.files.forEach(function (file) {
                file.labels = response.body[file.id];
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
        fileIdsToShow(fileIdsToShow) {
            // If the shown files differ from the default sequence, store them for
            // the annotation tool.
            let fileIds = this.fileIds;
            let equal = fileIdsToShow.length === fileIds.length;

            if (equal) {
                for (let i = fileIdsToShow.length - 1; i >= 0; i--) {
                    if (fileIdsToShow[i] !== fileIds[i]) {
                        equal = false;
                        break;
                    }
                }
            }

            if (equal) {
                localStorage.removeItem(this.filesStorageKey);
            } else {
                localStorage.setItem(
                    this.filesStorageKey,
                    JSON.stringify(fileIdsToShow)
                );
            }

            FilesStore.count = fileIdsToShow.length;
        },
        showFilenames(show) {
            this.settings.set('showFilenames', show);
        },
        showLabels(show) {
            this.settings.set('showLabels', show);
        },
    },
    created() {
        this.type = biigle.$require('volumes.type');
        this.fileIds = biigle.$require('volumes.fileIds');
        this.filterSequence = this.fileIds;
        this.sortingSequence = this.fileIds;
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

        let fileUuids = biigle.$require('volumes.fileUuids');
        let thumbUri = biigle.$require('volumes.thumbUri');
        let thumbCount = biigle.$require('volumes.thumbCount');
        let annotateUri = biigle.$require('volumes.annotateUri');
        let infoUri = biigle.$require('volumes.infoUri');
        // Do this here instead of a computed property so the file objects get
        // reactive. Also, this array does never change between page reloads.
        this.files = this.fileIds.map(function (id) {
            let thumbnailUrl;
            if (thumbCount > 1) {
                thumbnailUrl = Array.from(Array(thumbCount).keys()).map(function (i) {
                    return thumbUri.replace(':uuid', transformUuid(fileUuids[id]) + '/' + i);
                });
            } else {
                thumbnailUrl = thumbUri.replace(':uuid', transformUuid(fileUuids[id]));
            }

            return {
                id: id,
                thumbnailUrl: thumbnailUrl,
                annotateUrl: annotateUri.replace(':id', id),
                infoUrl: infoUri ? infoUri.replace(':id', id) : undefined,
                flagged: false,
                filename: null,
                labels: [],
            };
        });

        this.restoreSettings();
    },
};
</script>
