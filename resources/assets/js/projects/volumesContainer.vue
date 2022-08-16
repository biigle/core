<script>
import AttachableVolumesApi from './api/attachableVolumes';
import Events from '../core/events';
import LoaderMixin from '../core/mixins/loader';
import PreviewThumbnail from './components/previewThumbnail';
import statisticsModal from './components/statisticsModal';
import ProjectsApi from '../core/api/projects';
import Typeahead from '../core/components/typeahead';
import {handleErrorResponse} from '../core/messages/store';


const SORTING = {
    DATE_DOWN: 'date-down',
    DATE_UP: 'date-up',
    NAME_DOWN: 'name-down',
    NAME_UP: 'name-up,'
};

const SORTING_STORAGE_KEY = 'biigle.projects.volume-sorting';

/**
 * The volume list on the project show view.
 */
export default {
    mixins: [
        LoaderMixin,
    ],
    data() {
        return {
            project: null,
            volumes: [],
            fetchedAttachableVolumes: false,
            attachableVolumes: [],
            filterString: '',
            showImageVolumes: true,
            showVideoVolumes: true,
            currentSorting: SORTING.DATE_DOWN,
            showModal: false
        };
    },
    components: {
        previewThumbnail: PreviewThumbnail,
        typeahead: Typeahead,
        statisticsModal: statisticsModal,
    },
    computed: {
        sortedVolumes() {
            let volumes = this.volumes.slice();

            switch (this.currentSorting) {
                case SORTING.NAME_DOWN:
                    return volumes.sort(function (a, b) {
                        return a.name.localeCompare(b.name, undefined, {
                            numeric: true,
                            sensitivity: 'base',
                        });
                    });
                case SORTING.NAME_UP:
                    return volumes.sort(function (a, b) {
                        return b.name.localeCompare(a.name, undefined, {
                            numeric: true,
                            sensitivity: 'base',
                        });
                    });
                case SORTING.DATE_UP:
                    return volumes.sort(function (a, b) {
                        return a.created_at < b.created_at ? -1 : 1;
                    });
                default:
                    return volumes;
            }
        },
        filteredVolumes() {
            let volumes = this.sortedVolumes;

            if (!this.showImageVolumes) {
                volumes = volumes.filter((volume) => volume.media_type.name !== 'image');
            }

            if (!this.showVideoVolumes) {
                volumes = volumes.filter((volume) => volume.media_type.name !== 'video');
            }

            if (this.hasFiltering) {
                let filterString = this.filterString.toLowerCase();

                volumes = volumes.filter((volume) => volume.name.toLowerCase().includes(filterString));
            }

            return volumes;
        },
        hasFiltering() {
            return this.filterString.length > 0;
        },
        filterInputClass() {
            return this.hasFiltering ? 'volume-filter--active' : '';
        },
        hasVolumes() {
            return this.volumes.length > 0;
        },
        hasNoMatchingVolumes() {
            return this.hasVolumes && this.filteredVolumes.length === 0;
        },
        hasMixedMediaTypes() {
            return this.volumes.some((v) => v.media_type.name === 'image') && this.volumes.some((v) => v.media_type.name === 'video');
        },
        toggleImageVolumesClass() {
            return this.showVideoVolumes ? 'btn-default' : 'btn-info active';
        },
        toggleVideoVolumesClass() {
            return this.showImageVolumes ? 'btn-default' : 'btn-info active';
        },
        sortByDateDownClass() {
            return {
                active: this.currentSorting === SORTING.DATE_DOWN,
            };
        },
        sortByDateUpClass() {
            return {
                active: this.currentSorting === SORTING.DATE_UP,
            };
        },
        sortByNameDownClass() {
            return {
                active: this.currentSorting === SORTING.NAME_DOWN,
            };
        },
        sortByNameUpClass() {
            return {
                active: this.currentSorting === SORTING.NAME_UP,
            };
        },
    },
    methods: {
        removeVolume(id) {
            this.startLoading();
            ProjectsApi.detachVolume({id: this.project.id, volume_id: id})
                .then(() => this.volumeRemoved(id), (response) => {
                    if (response.status === 400) {
                        if (confirm('The volume you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this volume?')) {
                            this.forceRemoveVolume(id);
                        }
                    } else {
                        handleErrorResponse(response);
                    }
                })
                .finally(this.finishLoading);
        },
        forceRemoveVolume(id) {
            this.startLoading();
            ProjectsApi.detachVolume({id: this.project.id, volume_id: id}, {force: true})
                .then(() => this.volumeRemoved(id), handleErrorResponse)
                .finally(this.finishLoading);
        },
        volumeRemoved(id) {
            for (let i = this.volumes.length - 1; i >= 0; i--) {
                if (this.volumes[i].id === id) {
                    this.attachableVolumes.unshift(this.volumes[i]);
                    this.volumes.splice(i, 1);
                }
            }
        },
        showStatistics(id) {
            this.showModal = true;
        },
        hasVolume(id) {
            for (let i = this.volumes.length - 1; i >= 0; i--) {
                if (this.volumes[i].id === id) {
                    return true;
                }
            }

            return false;
        },
        attachVolume(volume) {
            if (volume && !this.hasVolume(volume.id)) {
                this.startLoading();
                ProjectsApi.attachVolume({id: this.project.id, volume_id: volume.id}, {})
                    .then(() => this.volumeAttached(volume), handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        volumeAttached(volume) {
            this.volumes.unshift(volume);
            for (let i = this.attachableVolumes.length - 1; i >= 0; i--) {
                if (this.attachableVolumes[i].id === volume.id) {
                    this.attachableVolumes.splice(i, 1);
                }
            }
        },
        fetchAttachableVolumes() {
            if (!this.fetchedAttachableVolumes) {
                this.fetchedAttachableVolumes = true;
                this.startLoading();
                AttachableVolumesApi.get({id: this.project.id})
                    .then(this.attachableVolumesFetched, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        attachableVolumesFetched(response) {
            this.attachableVolumes = response.data.map(this.processVolumes);
        },
        clearFiltering(e) {
            e.preventDefault();
            this.filterString = '';
        },
        toggleImageVolumes() {
            this.showVideoVolumes = !this.showVideoVolumes;
            if (!this.showImageVolumes && !this.showVideoVolumes) {
                this.showImageVolumes = true;
            }
        },
        toggleVideoVolumes() {
            this.showImageVolumes = !this.showImageVolumes;
            if (!this.showVideoVolumes && !this.showImageVolumes) {
                this.showVideoVolumes = true;
            }
        },
        processVolumes(volume) {
            volume.icon = volume.media_type.name === 'image' ? 'image' : 'film';

            return volume;
        },
        sortByDateDown() {
            this.currentSorting = SORTING.DATE_DOWN;
        },
        sortByDateUp() {
            this.currentSorting = SORTING.DATE_UP;
        },
        sortByNameDown() {
            this.currentSorting = SORTING.NAME_DOWN;
        },
        sortByNameUp() {
            this.currentSorting = SORTING.NAME_UP;
        },
    },
    watch: {
        volumes(volumes) {
            Events.$emit('project.volumes.count', volumes.length)
        },
        currentSorting(sorting) {
            if (sorting === SORTING.DATE_DOWN) {
                window.localStorage.removeItem(SORTING_STORAGE_KEY);
            } else {
                window.localStorage.setItem(SORTING_STORAGE_KEY, sorting);
            }
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.volumes = biigle.$require('projects.volumes').map(this.processVolumes);
        let sorting = window.localStorage.getItem(SORTING_STORAGE_KEY);
        if (sorting) {
            this.currentSorting = sorting;
        }
        console.log('MODAL: ', this.showModal);
    },
};
</script>
