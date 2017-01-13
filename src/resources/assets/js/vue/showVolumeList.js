/**
 * The volume list on the project show view.
 */
biigle.$viewModel('projects-show-volume-list', function (element) {
    var projectVolumes = biigle.$require('api.projectVolumes');
    var attachableVolumes = biigle.$require('api.attachableVolumes');
    var messageStore = biigle.$require('messages.store');

    new Vue({
        el: element,
        data: {
            project: biigle.$require('projects.project'),
            volumes: biigle.$require('projects.volumes'),
            editing: false,
            loading: false,
            fetchedAttachableVolumes: false,
            attachableVolumes: [],
            // emplate for the attachable volumes typeahead
            template: '<span v-text="item.name"></span>'
        },
        components: {
            volumeThumbnail: biigle.$require('projects.components.volumeThumbnail'),
            typeahead: VueStrap.typeahead
        },
        methods: {
            removeVolume: function (id) {
                var self = this;
                this.startLoading();
                projectVolumes.detach({pid: this.project.id, id: id})
                    .then(function (response) {
                        self.spliceVolume(id);
                    }, function (response) {
                        if (response.status === 400) {
                            if (confirm('The volume you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this volume?')) {
                                self.forceRemoveVolume(id);
                            }
                        } else {
                            messageStore.handleErrorResponse(response);
                        }
                    })
                    .finally(this.quitLoading);
            },
            forceRemoveVolume: function (id) {
                var self = this;
                this.startLoading();
                projectVolumes.detach({pid: this.project.id, id: id}, {force: true})
                    .then(function (response) {
                        self.spliceVolume(id);
                    }, messageStore.handleErrorResponse)
                    .finally(this.quitLoading);
            },
            spliceVolume: function (id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        this.attachableVolumes.unshift(this.volumes[i]);
                        this.volumes.splice(i, 1);
                    }
                }
            },
            edit: function () {
                this.editing = !this.editing;
                if (!this.fetchedAttachableVolumes) {
                    this.fetchedAttachableVolumes = true;
                    this.fetchAttachableVolumes();
                }
            },
            startLoading: function () {
                this.loading = true;
            },
            quitLoading: function () {
                this.loading = false;
            },
            hasVolume: function (id) {
                for (var i = this.volumes.length - 1; i >= 0; i--) {
                    if (this.volumes[i].id === id) {
                        return true;
                    }
                }

                return false;
            },
            attachVolume: function (volume, typeahead) {
                typeahead.reset();
                if (volume && !this.hasVolume(volume.id)) {
                    var self = this;
                    this.startLoading();
                    projectVolumes.attach({pid: this.project.id, id: volume.id}, {})
                        .then(function () {
                            self.volumes.unshift(volume);
                            for (var i = self.attachableVolumes.length - 1; i >= 0; i--) {
                                if (self.attachableVolumes[i].id === volume.id) {
                                    self.attachableVolumes.splice(i, 1);
                                }
                            }
                        }, messageStore.handleErrorResponse)
                        .finally(this.quitLoading);
                }
            },
            fetchAttachableVolumes: function () {
                var self = this;
                attachableVolumes.get({id: this.project.id})
                    .then(function (response) {
                        self.attachableVolumes = response.data;
                    }, messageStore.handleErrorResponse);
            }
        }
    });
});
