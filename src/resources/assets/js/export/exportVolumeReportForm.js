/**
 * The form for requesting a volume report
 */
biigle.$viewModel('export-volume-report-form', function (element) {
    var volumeId = biigle.$require('export.volumeId');

    new Vue({
        el: element,
        mixins: [biigle.$require('export.mixins.reportForm')],
        data: {
            allowedOptions: {
                'Annotations': [
                    'export_area',
                    'separate_label_trees',
                    'annotation_session_id',
                ],
                'ImageLabels': [
                    'separate_label_trees',
                    'annotation_session_id',
                ]
            },
            options: {
                annotation_session_id: null,
            },
        },
        methods: {
            submit: function () {
                this.request(volumeId, biigle.$require('export.api.volumeReports'));
            },
        },
    });
});
