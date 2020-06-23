/**
 * The panel for editing the title information of a project
 */
biigle.$viewModel('projects-title', function (element) {
    var messages = biigle.$require('messages.store');
    var project = biigle.$require('projects.project');
    var projectsApi = biigle.$require('api.projects');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            project: project,
            // Duplicate the project properties so they can be changed and possibly
            // discarded without affecting the original project object.
            name: project.name,
            description: project.description,
        },
        computed: {
            hasDescription() {
                return !!this.description.length;
            },
            isChanged() {
                return this.name !== this.project.name || this.description !== this.project.description;
            },
        },
        methods: {
            discardChanges() {
                this.name = this.project.name;
                this.description = this.project.description;
                this.finishEditing();
            },
            leaveProject() {
                var confirmed = confirm('Do you really want to revoke your membership of project "' + this.project.name + '"?');

                if (confirmed) {
                    this.startLoading();
                    projectsApi.removeUser({
                        id: this.project.id,
                        user_id: biigle.$require('projects.userId'),
                    })
                    .then(this.projectLeft, messages.handleErrorResponse)
                    .finally(this.finishLoading);
                }
            },
            projectLeft() {
                messages.success('You left the project. Redirecting...');
                setTimeout(function () {
                    location.href = biigle.$require('projects.redirectUrl');
                 }, 2000);
            },
            deleteProject() {
                var confirmed = confirm('Do you really want to delete the project ' + this.project.name + '?');

                if (confirmed) {
                    this.startLoading();
                    projectsApi.delete({id: this.project.id})
                        .then(this.projectDeleted, this.maybeForceDeleteProject)
                        .finally(this.finishLoading);
                }
            },
            maybeForceDeleteProject(response) {
                if (response.status === 400) {
                    var confirmed = confirm('Deleting this project will delete one or more volumes with all annotations! Do you want to continue?');
                    if (confirmed) {
                        this.startLoading();
                        projectsApi.delete({id: this.project.id}, {force: true})
                            .then(this.projectDeleted, messages.handleErrorResponse)
                            .finally(this.finishLoading);
                    }
                } else {
                    messages.handleErrorResponse(response);
                }
            },
            projectDeleted() {
                messages.success('The project was deleted. Redirecting...');
                setTimeout(function () {
                    location.href = biigle.$require('projects.redirectUrl');
                 }, 2000);
            },
            saveChanges() {
                this.startLoading();
                projectsApi.update({id: this.project.id}, {
                        name: this.name,
                        description: this.description,
                    })
                    .then(this.changesSaved, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            changesSaved() {
                this.project.name = this.name;
                this.project.description = this.description;
                this.finishEditing();
            }
        }
    });
});
