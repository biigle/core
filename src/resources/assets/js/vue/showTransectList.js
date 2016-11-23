/**
 * The transect list on the project show view.
 */
biigle.$viewModel('projects-show-transect-list', function (element) {
    new Vue({
        el: element,
        data: {
            project: biigle.projects.project,
            transects: biigle.projects.transects,
            editing: false,
            loading: false
        },
        components: {
            transectThumbnail: biigle.projects.components.transectThumbnail
        },
        methods: {
            removeTransect: function (id) {
                var self = this;
                this.startLoading();
                biigle.api.projectTransects.detach({pid: this.project.id, id: id})
                    .then(function (response) {
                        self.spliceTransect(id);
                    }, function (response) {
                        if (response.status === 400) {
                            if (confirm('The transect you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this transect?')) {
                                self.forceRemoveTransect(id);
                            }
                        } else {
                            biigle.messages.store.handleErrorResponse(response);
                        }
                    })
                    .finally(this.quitLoading);
            },
            forceRemoveTransect: function (id) {
                var self = this;
                this.startLoading();
                biigle.api.projectTransects.detach({pid: this.project.id, id: id}, {force: true})
                    .then(function (response) {
                        self.spliceTransect(id);
                    }, biigle.messages.store.handleErrorResponse)
                    .finally(this.quitLoading);
            },
            spliceTransect: function (id) {
                for (var i = this.transects.length - 1; i >= 0; i--) {
                    if (this.transects[i].id === id) {
                        this.transects.splice(i, 1);
                    }
                }
            },
            edit: function () {
                this.editing = !this.editing;
            },
            startLoading: function () {
                this.loading = true;
            },
            quitLoading: function () {
                this.loading = false;
            }
        }
    });
});
