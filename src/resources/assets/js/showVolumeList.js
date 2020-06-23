/**
 * The volume list on the project show view.
 */
biigle.$viewModel('projects-show-volume-list', function (element) {
    var projectsApi = biigle.$require('api.projects');
    var attachableVolumes = biigle.$require('api.attachableVolumes');
    var messages = biigle.$require('messages.store');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            project: biigle.$require('projects.project'),
            volumes: biigle.$require('projects.volumes'),
            attachableVolumes: [],
            filterString: '',
            fullHeight: 0,
        },
        components: {
            previewThumbnail: biigle.$require('projects.components.previewThumbnail'),
            typeahead: biigle.$require('core.components.typeahead')
        },
        computed: {
            filteredVolumes() {
                if (this.hasFiltering) {
                    var filterString = this.filterString.toLowerCase();

                    return this.volumes.filter(function (volume) {
                        return volume.name.toLowerCase().indexOf(filterString) !== -1;
                    });
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
                var self = this;
                this.startLoading();
                projectsApi.detachVolume({id: this.project.id, volume_id: id})
                    .then(function () {
                        self.volumeRemoved(id);
                    }, function (response) {
                        if (response.status === 400) {
                            if (confirm('The volume you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this volume?')) {
                                self.forceRemoveVolume(id);
                            }
                        } else {
                            messages.handleErrorResponse(response);
                        }
                    })
                    .finally(this.finishLoading);
            },
            forceRemoveVolume(id) {
                var self = this;
                this.startLoading();
                projectsApi.detachVolume({id: this.project.id, volume_id: id}, {force: true})
                    .then(function () {
                        self.volumeRemoved(id);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            volumeRemoved(id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        this.attachableVolumes.unshift(this.volumes[i]);
                        this.volumes.splice(i, 1);
                    }
                }

                this.$nextTick(this.updateFullHeight);
            },
            hasVolume(id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        return true;
                    }
                }

                return false;
            },
            attachVolume(volume) {
                if (volume && !this.hasVolume(volume.id)) {
                    var self = this;
                    this.startLoading();
                    projectsApi.attachVolume({id: this.project.id, volume_id: volume.id}, {})
                        .then(function () {
                            self.volumeAttached(volume);
                        }, messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            volumeAttached(volume) {
                this.volumes.unshift(volume);
                for (var i = this.attachableVolumes.length - 1; i >= 0; i--) {
                    if (this.attachableVolumes[i].id === volume.id) {
                        this.attachableVolumes.splice(i, 1);
                    }
                }

                this.$nextTick(this.updateFullHeight);
            },
            fetchAttachableVolumes() {
                attachableVolumes.get({id: this.project.id})
                    .then(this.attachableVolumesFetched, messages.handleErrorResponse);
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
            this.$once('editing.start', this.fetchAttachableVolumes);
        },
        mounted() {
            this.updateFullHeight();
        },
    });
});
