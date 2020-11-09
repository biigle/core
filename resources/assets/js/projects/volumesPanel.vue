<script>
import AttachableVolumesApi from './api/attachableVolumes';
import EditorMixin from '../core/mixins/editor';
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
        EditorMixin,
    ],
    data() {
        return {
            project: null,
            volumes: [],
            attachableVolumes: [],
            filterString: '',
            fullHeight: 0,
        };
    },
    components: {
        previewThumbnail: PreviewThumbnail,
        typeahead: Typeahead,
    },
    computed: {
        filteredVolumes() {
            if (this.hasFiltering) {
                let filterString = this.filterString.toLowerCase();

                return this.volumes.filter(
                    (volume) => volume.name.toLowerCase().indexOf(filterString) !== -1
                );
            }

            return this.volumes;
        },
        hasFiltering() {
            return this.filterString.length > 0;
        },
        filterInputClass() {
            return this.hasFiltering ? 'panel-filter--active' : '';
        },
        hasVolumes() {
            return this.volumes.length > 0;
        },
        panelStyle() {
            if (this.hasFiltering) {
                return {
                    height: this.fullHeight + 'px',
                };
            }

            return {};
        },
        hasNoMatchingVolumes() {
            return this.hasVolumes && this.filteredVolumes.length === 0;
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

            this.$nextTick(this.updateFullHeight);
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

            this.$nextTick(this.updateFullHeight);
        },
        fetchAttachableVolumes() {
            AttachableVolumesApi.get({id: this.project.id})
                .then(this.attachableVolumesFetched, handleErrorResponse);
        },
        attachableVolumesFetched(response) {
            this.attachableVolumes = response.data;
        },
        clearFiltering() {
            this.filterString = '';
        },
        updateFullHeight() {
            this.fullHeight = this.$el.offsetHeight;
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.volumes = biigle.$require('projects.volumes').map(function (volume) {
            volume.icon = volume.media_type.name === 'image' ? 'image' : 'film';

            return volume;
        });
        this.$once('editing.start', this.fetchAttachableVolumes);
    },
    mounted() {
        this.updateFullHeight();
    },
};
</script>
