/**
 * The form for requesting a volume report
 */
biigle.$viewModel('export-volume-report-form', function (element) {
    var volumeId = biigle.$require('export.volumeId');

    new Vue({
        el: element,
        mixins: [biigle.$require('export.mixins.reportForm')],
        data: {
            variants: {
                'annotations': [
                    'basic',
                    'extended',
                    'area',
                    'full',
                    'csv'
                ],
                'image-labels': [
                    'basic',
                    'csv'
                ]
            },
            allowedOptions: {
                'annotations': [
                    'exportArea',
                    'separateLabelTrees',
                    'annotationSession'
                ],
                'image-labels': [
                    'separateLabelTrees',
                    'annotationSession'
                ]
            },
            options: {
                annotationSession: null,
            },
        },
        methods: {
            submit: function () {
                this.request(volumeId, 'volumes');
            }
        }
    });
});
