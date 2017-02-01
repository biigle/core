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
        },
        components: {
            volumeThumbnail: biigle.$require('projects.components.volumeThumbnail'),
            typeahead: biigle.$require('core.components.typeahead')
        },
        methods: {
            removeVolume: function (id) {
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
            forceRemoveVolume: function (id) {
                var self = this;
                this.startLoading();
                projectsApi.detachVolume({id: this.project.id, volume_id: id}, {force: true})
                    .then(function () {
                        self.volumeRemoved(id);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            volumeRemoved: function (id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        this.attachableVolumes.unshift(this.volumes[i]);
                        this.volumes.splice(i, 1);
                    }
                }
            },
            hasVolume: function (id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        return true;
                    }
                }

                return false;
            },
            attachVolume: function (volume) {
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
            volumeAttached: function (volume) {
                this.volumes.unshift(volume);
                for (var i = this.attachableVolumes.length - 1; i >= 0; i--) {
                    if (this.attachableVolumes[i].id === volume.id) {
                        this.attachableVolumes.splice(i, 1);
                    }
                }
            },
            fetchAttachableVolumes: function () {
                attachableVolumes.get({id: this.project.id})
                    .then(this.attachableVolumesFetched, messages.handleErrorResponse);
            },
            attachableVolumesFetched: function (response) {
                this.attachableVolumes = response.data;
            },
        },
        created: function () {
            this.$once('editing.start', this.fetchAttachableVolumes);
        },
    });
});
