<script>
import AttachableVolumesApi from './api/attachableVolumes';
import Events from '../core/events';
import LoaderMixin from '../core/mixins/loader';
import PreviewThumbnail from './components/previewThumbnail';
import ProjectsApi from '../core/api/projects';
import Typeahead from '../core/components/typeahead';
import {handleErrorResponse} from '../core/messages/store';

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
        };
    },
    components: {
        previewThumbnail: PreviewThumbnail,
        typeahead: Typeahead,
    },
    computed: {
        filteredVolumes() {
            let volumes = this.volumes;

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
    },
    watch: {
        volumes(volumes) {
            Events.$emit('project.volumes.count', volumes.length)
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.volumes = biigle.$require('projects.volumes').map(this.processVolumes);
    },
};
</script>
