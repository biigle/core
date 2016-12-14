/**
 * The transect list on the project show view.
 */
biigle.$viewModel('projects-show-transect-list', function (element) {
    var projectTransects = biigle.$require('api.projectTransects');
    var attachableTransects = biigle.$require('api.attachableTransects');
    var messageStore = biigle.$require('messages.store');

    new Vue({
        el: element,
        data: {
            project: biigle.$require('projects.project'),
            transects: biigle.$require('projects.transects'),
            editing: false,
            loading: false,
            fetchedAttachableTransects: false,
            attachableTransects: [],
            // emplate for the attachable transects typeahead
            template: '<span v-text="item.name"></span>'
        },
        components: {
            transectThumbnail: biigle.$require('projects.components.transectThumbnail'),
            typeahead: VueStrap.typeahead
        },
        methods: {
            removeTransect: function (id) {
                var self = this;
                this.startLoading();
                projectTransects.detach({pid: this.project.id, id: id})
                    .then(function (response) {
                        self.spliceTransect(id);
                    }, function (response) {
                        if (response.status === 400) {
                            if (confirm('The transect you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this transect?')) {
                                self.forceRemoveTransect(id);
                            }
                        } else {
                            messageStore.handleErrorResponse(response);
                        }
                    })
                    .finally(this.quitLoading);
            },
            forceRemoveTransect: function (id) {
                var self = this;
                this.startLoading();
                projectTransects.detach({pid: this.project.id, id: id}, {force: true})
                    .then(function (response) {
                        self.spliceTransect(id);
                    }, messageStore.handleErrorResponse)
                    .finally(this.quitLoading);
            },
            spliceTransect: function (id) {
                for (var i = this.transects.length - 1; i >= 0; i--) {
                    if (this.transects[i].id === id) {
                        this.attachableTransects.unshift(this.transects[i]);
                        this.transects.splice(i, 1);
                    }
                }
            },
            edit: function () {
                this.editing = !this.editing;
                if (!this.fetchedAttachableTransects) {
                    this.fetchedAttachableTransects = true;
                    this.fetchAttachableTransects();
                }
            },
            startLoading: function () {
                this.loading = true;
            },
            quitLoading: function () {
                this.loading = false;
            },
            hasTransect: function (id) {
                for (var i = this.transects.length - 1; i >= 0; i--) {
                    if (this.transects[i].id === id) {
                        return true;
                    }
                }

                return false;
            },
            attachTransect: function (transect, typeahead) {
                typeahead.reset();
                if (transect && !this.hasTransect(transect.id)) {
                    var self = this;
                    this.startLoading();
                    projectTransects.attach({pid: this.project.id, id: transect.id}, {})
                        .then(function () {
                            self.transects.unshift(transect);
                            for (var i = self.attachableTransects.length - 1; i >= 0; i--) {
                                if (self.attachableTransects[i].id === transect.id) {
                                    self.attachableTransects.splice(i, 1);
                                }
                            }
                        }, messageStore.handleErrorResponse)
                        .finally(this.quitLoading);
                }
            },
            fetchAttachableTransects: function () {
                var self = this;
                attachableTransects.get({id: this.project.id})
                    .then(function (response) {
                        self.attachableTransects = response.data;
                    }, messageStore.handleErrorResponse);
            }
        }
    });
});
