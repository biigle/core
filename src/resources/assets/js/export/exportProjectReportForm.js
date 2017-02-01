/**
 * The form for requesting a project report
 */
biigle.$viewModel('export-project-report-form', function (element) {
    var projectId = biigle.$require('export.projectId');

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
                    'separateLabelTrees'
                ],
                'image-labels': [
                    'separateLabelTrees'
                ]
            },
        },
        methods: {
            submit: function () {
                this.request(projectId, 'projects');
            }
        },
    });
});
