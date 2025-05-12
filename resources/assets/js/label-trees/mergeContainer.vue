<script>
import LabelTreeDiff from './components/labelTreeDiff.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import MergeLabelTreesApi from './api/mergeLabelTrees.js';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * The merge label trees tool.
 */
export default {
    mixins: [
        LoaderMixin,
    ],
    components: {
        labelTreeDiff: LabelTreeDiff,
    },
    data() {
        return {
            baseTree: null,
            mergeTree: null,
            usedLabels: [],
            toAdd: [],
            toRemove: [],
            merged: false,
        };
    },
    computed: {
        baseTreeLabels() {
            return this.baseTree.labels;
        },
        mergeTreeLabels() {
            return this.mergeTree.labels;
        },
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
            let index = this.toAdd.indexOf(label);
            if (index !== -1) {
                this.toAdd.splice(index, 1);
            }
        },
        handleCancelRemove(label) {
            let index = this.toRemove.indexOf(label);
            if (index !== -1) {
                this.toRemove.splice(index, 1);
            }
        },
        bundleToAdd(toAdd) {
            let toAddMap = {};
            toAdd.forEach(function (label) {
                toAddMap[label.id] = {
                    name: label.name,
                    color: label.color,
                    parent_id: label.parent_id,
                    left_parent_id: label.left_parent_id,
                };
            });

            let bundled = [];
            Object.keys(toAddMap).forEach(function (id) {
                let label = toAddMap[id];
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
            let bundledToAdd = this.bundleToAdd(this.toAdd);
            let bundledToRemove = this.bundleToRemove(this.toRemove);

            MergeLabelTreesApi.save({id: this.baseTree.id}, {
                    create: bundledToAdd,
                    remove: bundledToRemove,
                })
                .then(this.handleMergeSuccess, this.handleMergeError);
        },
        handleMergeError(response) {
            this.finishLoading();
            handleErrorResponse(response);
        },
        handleMergeSuccess() {
            this.merged = true;
        },
    },
    created() {
        this.baseTree = biigle.$require('labelTrees.baseTree');
        this.mergeTree = biigle.$require('labelTrees.mergeTree');
        this.usedLabels = biigle.$require('labelTrees.usedLabels');
    },
};
</script>
