/**
 * The form for requesting a project report
 */
biigle.$viewModel('export-project-report-form', function (element) {
    var projectId = biigle.$require('export.projectId');

    new Vue({
        el: element,
        mixins: [biigle.$require('export.mixins.reportForm')],
        data: {
            allowedOptions: {
                'Annotations': [
                    'export_area',
                    'separate_label_trees'
                ],
                'ImageLabels': [
                    'separate_label_trees'
                ]
            },
        },
        methods: {
            submit: function () {
                this.request(projectId, biigle.$require('export.api.projectReports'));
            }
        },
    });
});
