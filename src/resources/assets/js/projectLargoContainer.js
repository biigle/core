/**
 * View model for the main Largo container (for projects)
 */
biigle.$viewModel('project-largo-container', function (element) {
    var projectsApi = biigle.$require('largo.api.projects');
    var projectId = biigle.$require('largo.projectId');

    new Vue({
        el: element,
        mixins: [biigle.$require('largo.mixins.largoContainer')],
        data: {
            labelTrees: biigle.$require('largo.labelTrees'),
        },
        methods: {
            queryAnnotations: function (label) {
                return projectsApi.queryAnnotations({id: projectId, label_id: label.id});
            },
            performSave: function (payload) {
                return projectsApi.save({id: projectId}, payload);
            },
        },
    });
});
