/**
 * The form for requesting a video report
 */
biigle.$viewModel('video-report-form', function (element) {
    var videoId = biigle.$require('reports.videoId');

    new Vue({
        el: element,
        mixins: [biigle.$require('reports.mixins.reportForm')],
        data: {
            selectedType: 'VideoAnnotations',
            selectedVariant: 'Csv',
            allowedOptions: {
                'VideoAnnotations': [
                    'separate_label_trees',
                ],
            },
        },
        methods: {
            submit: function () {
                this.request(videoId, biigle.$require('reports.api.videoReports'));
            },
        },
    });
});
