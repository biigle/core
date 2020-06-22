/**
 * The merge label trees tool.
 */
biigle.$viewModel('merge-label-trees-container', function (element) {
    var messages = biigle.$require('messages.store');
    var baseTree = biigle.$require('labelTrees.baseTree');
    var mergeTree = biigle.$require('labelTrees.mergeTree');
    var usedLabels = biigle.$require('labelTrees.usedLabels');
    var mergeLabelTreesApi = biigle.$require('labelTrees.api.mergeLabelTrees');

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
            merged: false,
        },
        computed: {
            cannotMerge() {
                return this.loading || (this.toAdd.length === 0 && this.toRemove.length === 0);
            },
            disableDiff() {
                return this.loading || this.merged;
            },
        },
        methods: {
            handleAdd(label) {
                if (this.toAdd.indexOf(label) === -1) {
                    this.toAdd.push(label);
                }
            },
            handleRemove(label) {
                if (this.toRemove.indexOf(label) === -1) {
                    this.toRemove.push(label);
                }
            },
            handleCancelAdd(label) {
                var index = this.toAdd.indexOf(label);
                if (index !== -1) {
                    this.toAdd.splice(index, 1);
                }
            },
            handleCancelRemove(label) {
                var index = this.toRemove.indexOf(label);
                if (index !== -1) {
                    this.toRemove.splice(index, 1);
                }
            },
            bundleToAdd(toAdd) {
                var toAddMap = {};
                toAdd.forEach(function (label) {
                    toAddMap[label.id] = {
                        name: label.name,
                        color: label.color,
                        parent_id: label.parent_id,
                        left_parent_id: label.left_parent_id,
                    };
                });

                var bundled = [];
                Object.keys(toAddMap).forEach(function (id) {
                    var label = toAddMap[id];
                    // The label should be added to the list of child labels of one of
                    // the labels that should also be created.
                    if (label.parent_id && toAddMap.hasOwnProperty(label.parent_id)) {
                        if (toAddMap[label.parent_id].children) {
                            toAddMap[label.parent_id].children.push(label);
                        } else {
                            toAddMap[label.parent_id].children = [label];
                        }
                        delete label.parent_id;
                        delete label.left_parent_id;
                    } else {
                        delete label.parent_id;
                        // If left_parent_id is set, the label should be inserted in some
                        // deeper level of the left label tree. Else it should be
                        // inserted as root label.
                        if (label.left_parent_id) {
                            label.parent_id = label.left_parent_id;
                        }
                        delete label.left_parent_id;

                        bundled.push(label);
                    }
                });

                return bundled;
            },
            bundleToRemove(toRemove) {
                return toRemove.map(function (label) {
                    return label.id;
                });
            },
            submitMerge() {
                this.startLoading();
                var bundledToAdd = this.bundleToAdd(this.toAdd);
                var bundledToRemove = this.bundleToRemove(this.toRemove);

                mergeLabelTreesApi.save({id: baseTree.id}, {
                        create: bundledToAdd,
                        remove: bundledToRemove,
                    })
                    .then(this.handleMergeSuccess, this.handleMergeError);
            },
            handleMergeError(response) {
                this.finishLoading();
                messages.handleResponseError(response);
            },
            handleMergeSuccess() {
                this.merged = true;
            },
        },
    });
});
