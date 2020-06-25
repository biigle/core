/**
 * The form for requesting a volume report
 */
biigle.$viewModel('volume-report-form', function (element) {
    let volumeId = biigle.$require('reports.volumeId');

    new Vue({
        el: element,
        mixins: [biigle.$require('reports.mixins.reportForm')],
        data: {
            allowedOptions: {
                'Annotations': [
                    'export_area',
                    'newest_label',
                    'separate_label_trees',
                    'annotation_session_id',
                    'only_labels',
                    'aggregate_child_labels',
                ],
                'ImageLabels': [
                    'separate_label_trees',
                    'annotation_session_id',
                    'only_labels',
                ],
            },
            options: {
                annotation_session_id: null,
            },
        },
        methods: {
            submit() {
                this.request(volumeId, biigle.$require('reports.api.volumeReports'));
            },
        },
    });
});
