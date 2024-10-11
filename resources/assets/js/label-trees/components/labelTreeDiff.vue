<template>
    <div class="label-tree-diff">
        <div v-if="hasDiff">
            <button
                class="btn btn-default"
                title="Accept all merge items"
                :disabled="cannotResolveAll"
                @click="acceptAll"
                >
                    Accept all
            </button>

            <button
                class="btn btn-default"
                title="Set all merge items as not accepted"
                :disabled="cannotResolveNone"
                @click="acceptNone"
                >
                    Accept none
            </button>
        </div>
        <table v-if="hasDiff" class="table table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th v-text="leftName"></th>
                    <th v-text="rightName"></th>
                </tr>
            </thead>
            <tbody>
                <label-tree-diff-row
                    v-for="item in diff"
                    :key="item.id"
                    :item="item"
                    :disabled="disabled"
                    @accepted="handleResolved"
                    ></label-tree-diff-row>
            </tbody>
        </table>
        <div v-else class="text-center lead">
            The label trees are identical.
        </div>
    </div>
</template>

<script>
import Row from './labelTreeDiffRow.vue';

/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
export default {
    components: {
        labelTreeDiffRow: Row,
    },
    data() {
        return {
            diff: [],
        };
    },
    props: {
        leftLabels: {
            type: Array,
            required: true,
        },
        leftName: {
            type: String,
            default: '',
        },
        rightLabels: {
            type: Array,
            required: true,
        },
        rightName: {
            type: String,
            default: '',
        },
        usedLabels: {
            type: Array,
            default() {
                return [];
            },
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        leftLabelsById() {
            let map = {};
            this.leftLabels.forEach(function (label) {
                map[label.id] = label;
            });

            return map;
        },
        leftLabelsAsTree() {
            let childMap = this.generateChildMap(this.leftLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
        },
        rightLabelsAsTree() {
            let childMap = this.generateChildMap(this.rightLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
        },
        usedLabelMap() {
            let map = {};
            this.usedLabels.forEach((id) => {
                // Also add all parent labels as "used".
                do {
                    map[id] = null;
                    id = this.leftLabelsById[id].parent_id;
                } while (id !== null);
            });

            return map;
        },
        cannotResolveAll() {
            return this.disabled || this.diff.reduce(function (carry, row) {
                if (row.acceptable) {
                    return carry && row.accepted;
                }

                return carry;
            }, true);
        },
        cannotResolveNone() {
            return this.disabled || this.diff.reduce(function (carry, row) {
                if (row.acceptable) {
                    return carry && !row.accepted;
                }

                return carry;
            }, true);
        },
        hasDiff() {
            return this.diff.length > 0;
        },
    },
    methods: {
        generateChildMap(labels) {
            let childMap = {};
            labels.forEach(function (label) {
                if (childMap.hasOwnProperty(label.parent_id)) {
                    childMap[label.parent_id].push(label);
                } else {
                    childMap[label.parent_id] = [label];
                }
            });

            return childMap;
        },
        generateLabelsAsTree(labels, childMap) {
            return labels.map((label) => {
                    if (childMap.hasOwnProperty(label.id)) {
                        label.children = this.generateLabelsAsTree(childMap[label.id], childMap);
                    } else {
                        label.children = [];
                    }

                    return label;
                })
                .sort(function (a, b) {
                    // Sort by name and color to correctly handle labels with the same
                    // name but different color.
                    let aCompare = a.name + '-' + a.color;
                    let bCompare = b.name + '-' + b.color;

                    return aCompare <= bCompare ? -1 : 1;
                });
        },
        generateTreeDiff(leftLabels, rightLabels, diff, level) {
            leftLabels = leftLabels.slice();
            rightLabels = rightLabels.slice();
            diff = diff || [];
            level = level || 0;

            while (leftLabels.length > 0 && rightLabels.length > 0) {
                let left = leftLabels[0];
                let right = rightLabels[0];
                if (left.name === right.name) {
                    leftLabels.shift();
                    rightLabels.shift();
                    diff.push({
                        id: left.id,
                        level: level,
                        left: left,
                        right: right,
                    });
                    this.generateTreeDiff(left.children, right.children, diff, level + 1);
                } else if (left.name < right.name) {
                    leftLabels.shift();
                    diff.push({
                        id: left.id,
                        level: level,
                        accepted: false,
                        acceptable: !this.usedLabelMap.hasOwnProperty(left.id),
                        left: left,
                        right: null,
                    });
                    this.generateTreeDiff(left.children, [], diff, level + 1);
                } else {
                    rightLabels.shift();
                    diff.push({
                        id: right.id,
                        level: level,
                        accepted: false,
                        acceptable: true,
                        left: null,
                        right: right,
                    });
                    this.generateTreeDiff([], right.children, diff, level + 1);
                }
            }

            if (leftLabels.length > 0) {
                leftLabels.forEach((label) => {
                    diff.push({
                        id: label.id,
                        level: level,
                        accepted: false,
                        acceptable: !this.usedLabelMap.hasOwnProperty(label.id),
                        left: label,
                        right: null,
                    });
                    this.generateTreeDiff(label.children, [], diff, level + 1);
                });
            }

            if (rightLabels.length > 0) {
                rightLabels.forEach((label) => {
                    diff.push({
                        id: label.id,
                        level: level,
                        accepted: false,
                        acceptable: true,
                        left: null,
                        right: label,
                    });
                    this.generateTreeDiff([], label.children, diff, level + 1);
                });
            }

            return diff;
        },
        filterRelevantItems(diff) {
            let isDifferent = [];

            diff.forEach(function (row, index) {
                if (row.left === null || row.right === null) {
                    isDifferent.push(index);
                }
            });

            isDifferent.forEach(function (index) {
                diff[index].relevant = true;
                let currentLevel = diff[index].level;
                let currentIndex = index;
                while (currentIndex >= 0 && currentLevel > 0) {
                    if (diff[currentIndex].level < currentLevel) {
                        diff[currentIndex].relevant = true;
                        currentLevel = diff[currentIndex].level;
                    }
                    currentIndex -= 1;
                }
            });

            return diff.filter(function (row) {
                return row.relevant;
            });
        },
        handleResolved(row) {
            if (row.acceptable) {
                if (row.accepted) {
                    this.cancelResolved(row);
                    if (row.left === null) {
                        this.acceptCancelAddAllChildren(row);
                    } else if (row.right === null) {
                        this.acceptCancelDeleteAllParents(row);
                    }
                } else {
                    this.setResolved(row);
                    if (row.left === null) {
                        this.acceptAddAllParents(row);
                    } else if (row.right === null) {
                        this.acceptDeleteAllChildren(row);
                    }
                }
            }
        },
        cancelResolved(row) {
            if (row.left === null) {
                this.$emit('cancel-add', row.right);
            } else if (row.right === null) {
                this.$emit('cancel-remove', row.left);
            }

            row.accepted = false;
        },
        setResolved(row) {
            if (row.left === null) {
                this.$emit('add', row.right);
            } else if (row.right === null) {
                this.$emit('remove', row.left);
            }

            row.accepted = true;
        },
        acceptAll() {
            this.diff.forEach((row) => {
                if (!row.accepted) {
                    this.handleResolved(row);
                }
            });
        },
        acceptNone() {
            this.diff.forEach((row) => {
                if (row.accepted) {
                    this.handleResolved(row);
                }
            });
        },
        doForAllChildren(row, callback) {
            let level = row.level + 1;
            let index = this.diff.indexOf(row) + 1;
            while (this.diff[index] && this.diff[index].level >= level) {
                callback.call(this, this.diff[index]);
                index += 1;
            }
        },
        doForAllParents(row, callback) {
            let level = row.level;
            let index = this.diff.indexOf(row) - 1;
            while (level > 0 && index >= 0) {
                if (this.diff[index].level < level) {
                    level = this.diff[index].level;
                    callback.call(this, this.diff[index]);
                }

                index -= 1;
            }
        },
        acceptDeleteAllChildren(row) {
            this.doForAllChildren(row, function (child) {
                if (child.right === null) {
                    this.setResolved(child);
                }
            });
        },
        acceptCancelAddAllChildren(row) {
            this.doForAllChildren(row, function (child) {
                if (child.left === null) {
                    this.cancelResolved(child);
                }
            });
        },
        acceptAddAllParents(row) {
            this.doForAllParents(row, function (child) {
                if (child.left === null) {
                    this.setResolved(child);
                }
            });
        },
        acceptCancelDeleteAllParents(row) {
            this.doForAllParents(row, function (child) {
                if (child.right === null) {
                    this.cancelResolved(child);
                }
            });
        },
        setLeftParentIds(diff) {
            let rightToLeftMap = {};
            diff.forEach(function (row) {
                if (row.right && row.left) {
                    rightToLeftMap[row.right.id] = row.left.id;
                }
            });

            diff.forEach(function (row) {
                if (row.right && row.right.parent_id) {
                    row.right.left_parent_id = rightToLeftMap[row.right.parent_id];
                }
            });

            return diff;
        },
    },
    created() {
        let diff = this.generateTreeDiff(this.leftLabelsAsTree, this.rightLabelsAsTree);
        diff = this.filterRelevantItems(diff);
        // THe left parent IDs are required to bundle the data for the API later.
        diff = this.setLeftParentIds(diff);
        this.diff = diff;
    },
};
</script>
