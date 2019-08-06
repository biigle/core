/**
 * The merge label trees tool.
 */
biigle.$viewModel('merge-label-trees-container', function (element) {
    var messages = biigle.$require('messages.store');
    var baseTree = biigle.$require('labelTrees.baseTree');
    var mergeTree = biigle.$require('labelTrees.mergeTree');
    var usedLabels = biigle.$require('labelTrees.usedLabels');
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
            usedLabels: usedLabels,
            toAdd: [],
            toRemove: [],
        },
        computed: {
            cannotMerge: function () {
                return this.loading || (this.toAdd.length === 0 && this.toRemove.length === 0);
            },
        },
        methods: {
            handleAdd: function (label) {
                if (this.toAdd.indexOf(label) === -1) {
                    this.toAdd.push(label);
                }
            },
            handleRemove: function (label) {
                if (this.toRemove.indexOf(label) === -1) {
                    this.toRemove.push(label);
                }
            },
            handleCancelAdd: function (label) {
                var index = this.toAdd.indexOf(label);
                if (index !== -1) {
                    this.toAdd.splice(index, 1);
                }
            },
            handleCancelRemove: function (label) {
                var index = this.toRemove.indexOf(label);
                if (index !== -1) {
                    this.toRemove.splice(index, 1);
                }
            },
            submitMerge: function () {
                this.startLoading();
                console.log('add', this.toAdd);
                console.log('remove', this.toRemove);
            },
        },
    });
});
