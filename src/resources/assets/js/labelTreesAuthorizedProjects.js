/**
 * The panel for editing the authorized projects of a label tree
 */
biigle.$viewModel('label-trees-authorized-projects', function (element) {
    var messages = biigle.$require('messages.store');
    var projectsApi = biigle.$require('api.projects');
    var labelTreeApi = biigle.$require('api.labelTree');

    var privateId = biigle.$require('labelTrees.privateVisibilityId');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            labelTree: biigle.$require('labelTrees.labelTree'),
            ownProjects: [],
            authorizedProjects: biigle.$require('labelTrees.authorizedProjects'),
            authorizedOwnProjects: biigle.$require('labelTrees.authorizedOwnProjects'),
        },
        components: {
            typeahead: biigle.$require('core.components.typeahead'),
        },
        computed: {
            isPrivate: function () {
                return this.labelTree.visibility_id === privateId;
            },
            classObject: function () {
                return {
                    'panel-warning': this.editing,
                };
            },
            authorizableProjects: function () {
                var self = this;
                return this.ownProjects.filter(function (project) {
                    for (var i = self.authorizedProjects.length - 1; i >= 0; i--) {
                        if (self.authorizedProjects[i].id === project.id) {
                            return false;
                        }
                    }

                    return true;
                });
            },
            hasAuthorizedProjects: function () {
                return this.authorizedProjects.length > 0;
            },
        },
        methods: {
            fetchOwnProjects: function () {
                var self = this;
                projectsApi.query().then(function (response) {
                    Vue.set(self, 'ownProjects', response.body);
                }, messages.handleErrorResponse);
            },
            addAuthorizedProject: function (project) {
                var self = this;
                this.startLoading();
                labelTreeApi.addAuthorizedProject({id: this.labelTree.id}, {id: project.id})
                    .then(function () {
                        self.authorizedProjectAdded(project);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            authorizedProjectAdded: function (project) {
                this.authorizedProjects.push(project);
                // user can only authorize own projects
                this.authorizedOwnProjects.push(project.id);
            },
            removeAuthorizedProject: function (project) {
                var self = this;
                this.startLoading();
                labelTreeApi.removeAuthorizedProject({id: this.labelTree.id, project_id: project.id})
                    .then(function () {
                        self.authorizedProjectRemoved(project);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            authorizedProjectRemoved: function (project) {
                var i;
                for (i = this.authorizedProjects.length - 1; i >= 0; i--) {
                    if (this.authorizedProjects[i].id === project.id) {
                        this.authorizedProjects.splice(i, 1);
                    }
                }

                i = this.authorizedOwnProjects.indexOf(project.id);
                if (i !== -1) {
                    this.authorizedOwnProjects.splice(i, 1);
                }
            },
            isOwnProject: function (project) {
                return this.authorizedOwnProjects.indexOf(project.id) !== -1;
            },
        },
        created: function () {
            this.$once('editing.start', this.fetchOwnProjects);
        }
    });
});
