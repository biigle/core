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
                    'separate_label_trees',
                    'only_labels',
                    'aggregate_child_labels',
                ],
                'ImageLabels': [
                    'separate_label_trees',
                    'only_labels',
                ],
                'VideoAnnotations': [
                    'separate_label_trees',
                    'only_labels',
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
