/**
 * The merge label trees tool.
 */
biigle.$viewModel('merge-label-trees-container', function (element) {
    var messages = biigle.$require('messages.store');
    var baseTree = biigle.$require('labelTrees.baseTree');
    var mergeTree = biigle.$require('labelTrees.mergeTree');
    var labelTreeApi = biigle.$require('api.labelTree');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
        ],
        components: {
            labelTreeDiff: biigle.$require('labelTrees.components.labelTreeDiff'),
        },
        data: {
            baseTreeLabels: baseTree.labels,
            mergeTreeLabels: mergeTree.labels,
        },
        computed: {
            //
        },
        methods: {
            //
        },
        created: function () {
            //
        },
    });
});
