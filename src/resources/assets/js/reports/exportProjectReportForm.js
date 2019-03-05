/**
 * The form for requesting a project report
 */
biigle.$viewModel('project-report-form', function (element) {
    var projectId = biigle.$require('reports.projectId');

    new Vue({
        el: element,
        mixins: [biigle.$require('reports.mixins.reportForm')],
        data: {
            allowedOptions: {
                'Annotations': [
                    'export_area',
                    'newest_label',
                    'separate_label_trees'
                ],
                'ImageLabels': [
                    'separate_label_trees'
                ],
                'VideoAnnotations': [
                    'separate_label_trees'
                ],
            },
        },
        methods: {
            submit: function () {
                this.request(projectId, biigle.$require('reports.api.projectReports'));
            }
        },
    });
});
