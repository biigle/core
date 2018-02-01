/**
 * View model for the annotation catalog
 */
biigle.$viewModel('annotation-catalog-container', function (element) {
    var labelsApi = biigle.$require('largo.api.labels');
    var labelTree = biigle.$require('annotationCatalog.labelTree');

    new Vue({
        el: element,
        mixins: [biigle.$require('largo.mixins.largoContainer')],
        components: {
            catalogImageGrid: biigle.$require('largo.components.catalogImageGrid'),
        },
        data: {
            labelTrees: [labelTree],
        },
        methods: {
            queryAnnotations: function (label) {
                return labelsApi.queryAnnotations({id: label.id});
            },
        },
    });
});
