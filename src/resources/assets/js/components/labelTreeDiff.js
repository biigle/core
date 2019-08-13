/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeDiff', {
    template: '<div class="label-tree-diff">' +
        '<div v-if="hasDiff">' +
            '<button ' +
                'class="btn btn-default" ' +
                'title="Accept all merge items" ' +
                ':disabled="cannotResolveAll" ' +
                '@click="acceptAll" ' +
                '>' +
                    'Accept all' +
            '</button>' +
            ' ' +
            '<button ' +
                'class="btn btn-default" ' +
                'title="Set all merge items as not accepted" ' +
                ':disabled="cannotResolveNone" ' +
                '@click="acceptNone" ' +
                '>' +
                    'Accept none' +
            '</button>' +
        '</div>' +
        '<table v-if="hasDiff" class="table table-hover">' +
            '<thead>' +
                '<tr>' +
                    '<th></th>' +
                    '<th v-text="leftName"></th>' +
                    '<th v-text="rightName"></th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '<label-tree-diff-row ' +
                    'v-for="item in diff" ' +
                    ':item="item" '+
                    ':disabled="disabled" '+
                    '@accepted="handleResolved" ' +
                    '></label-tree-diff-row>' +
            '</tbody>' +
        '</table>' +
        '<div v-else class="text-center lead">' +
            'The label trees are identical.' +
        '</div>' +
    '</div>',
    components: {
        labelTreeDiffRow: biigle.$require('labelTrees.components.labelTreeDiffRow'),
    },
    data: function () {
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
            default: [],
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        leftLabelsById: function () {
            var map = {};
            this.leftLabels.forEach(function (label) {
                map[label.id] = label;
            });

            return map;
        },
        leftLabelsAsTree: function () {
            var childMap = this.generateChildMap(this.leftLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
        },
        rightLabelsAsTree: function () {
            var childMap = this.generateChildMap(this.rightLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
        },
        usedLabelMap: function () {
            var map = {};
            this.usedLabels.forEach(function (id) {
                // Also add all parent labels as "used".
                do {
                    map[id] = null;
                    id = this.leftLabelsById[id].parent_id;
                } while (id !== null);
            }, this);

            return map;
        },
        cannotResolveAll: function () {
            return this.disabled || this.diff.reduce(function (carry, row) {
                if (row.acceptable) {
                    return carry && row.accepted;
                }

                return carry;
            }, true);
        },
        cannotResolveNone: function () {
            return this.disabled || this.diff.reduce(function (carry, row) {
                if (row.acceptable) {
                    return carry && !row.accepted;
                }

                return carry;
            }, true);
        },
        hasDiff: function () {
            return this.diff.length > 0;
        },
    },
    methods: {
        generateChildMap: function (labels) {
            var childMap = {};
            labels.forEach(function (label) {
                if (childMap.hasOwnProperty(label.parent_id)) {
                    childMap[label.parent_id].push(label);
                } else {
                    childMap[label.parent_id] = [label];
                }
            });

            return childMap;
        },
        generateLabelsAsTree: function (labels, childMap) {
            return labels.map(function (label) {
                    if (childMap.hasOwnProperty(label.id)) {
                        label.children = this.generateLabelsAsTree(childMap[label.id], childMap);
                    } else {
                        label.children = [];
                    }

                    return label;
                }, this)
                .sort(function (a, b) {
                    // Sort by name and color to correctly handle labels with the same
                    // name but different color.
                    var aCompare = a.name + '-' + a.color;
                    var bCompare = b.name + '-' + b.color;

                    return aCompare <= bCompare ? -1 : 1;
                });
        },
        generateTreeDiff: function (leftLabels, rightLabels, diff, level) {
            leftLabels = leftLabels.slice();
            rightLabels = rightLabels.slice();
            diff = diff || [];
            level = level || 0;

            while (leftLabels.length > 0 && rightLabels.length > 0) {
                var left = leftLabels[0];
                var right = rightLabels[0];
                if (left.name === right.name) {
                    leftLabels.shift();
                    rightLabels.shift();
                    diff.push({
                        level: level,
                        left: left,
                        right: right,
                    });
                    this.generateTreeDiff(left.children, right.children, diff, level + 1);
                } else if (left.name < right.name) {
                    leftLabels.shift();
                    diff.push({
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
                leftLabels.forEach(function (label) {
                    diff.push({
                        level: level,
                        accepted: false,
                        acceptable: !this.usedLabelMap.hasOwnProperty(label.id),
                        left: label,
                        right: null,
                    });
                    this.generateTreeDiff(label.children, [], diff, level + 1);
                }, this);
            }

            if (rightLabels.length > 0) {
                rightLabels.forEach(function (label) {
                    diff.push({
                        level: level,
                        accepted: false,
                        acceptable: true,
                        left: null,
                        right: label,
                    });
                    this.generateTreeDiff([], label.children, diff, level + 1);
                }, this);
            }

            return diff;
        },
        filterRelevantItems: function (diff) {
            var isDifferent = [];

            diff.forEach(function (row, index) {
                if (row.left === null || row.right === null) {
                    isDifferent.push(index);
                }
            });

            isDifferent.forEach(function (index) {
                diff[index].relevant = true;
                var currentLevel = diff[index].level;
                var currentIndex = index;
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
        handleResolved: function (row) {
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
        cancelResolved: function (row) {
            if (row.left === null) {
                this.$emit('cancel-add', row.right);
            } else if (row.right === null) {
                this.$emit('cancel-remove', row.left);
            }

            row.accepted = false;
        },
        setResolved: function (row) {
            if (row.left === null) {
                this.$emit('add', row.right);
            } else if (row.right === null) {
                this.$emit('remove', row.left);
            }

            row.accepted = true;
        },
        acceptAll: function () {
            this.diff.forEach(function (row) {
                if (!row.accepted) {
                    this.handleResolved(row);
                }
            }, this);
        },
        acceptNone: function () {
            this.diff.forEach(function (row) {
                if (row.accepted) {
                    this.handleResolved(row);
                }
            }, this);
        },
        doForAllChildren: function (row, callback) {
            var level = row.level + 1;
            var index = this.diff.indexOf(row) + 1;
            while (this.diff[index] && this.diff[index].level >= level) {
                callback.call(this, this.diff[index]);
                index += 1;
            }
        },
        doForAllParents: function (row, callback) {
            var level = row.level;
            var index = this.diff.indexOf(row) - 1;
            while (level > 0 && index >= 0) {
                if (this.diff[index].level < level) {
                    level = this.diff[index].level;
                    callback.call(this, this.diff[index]);
                }

                index -= 1;
            }
        },
        acceptDeleteAllChildren: function (row) {
            this.doForAllChildren(row, function (child) {
                if (child.right === null) {
                    this.setResolved(child);
                }
            });
        },
        acceptCancelAddAllChildren: function (row) {
            this.doForAllChildren(row, function (child) {
                if (child.left === null) {
                    this.cancelResolved(child);
                }
            });
        },
        acceptAddAllParents: function (row) {
            this.doForAllParents(row, function (child) {
                if (child.left === null) {
                    this.setResolved(child);
                }
            });
        },
        acceptCancelDeleteAllParents: function (row) {
            this.doForAllParents(row, function (child) {
                if (child.right === null) {
                    this.cancelResolved(child);
                }
            });
        },
        setLeftParentIds: function (diff) {
            var rightToLeftMap = {};
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
    created: function () {
        var diff = this.generateTreeDiff(this.leftLabelsAsTree, this.rightLabelsAsTree);
        diff = this.filterRelevantItems(diff);
        // THe left parent IDs are required to bundle the data for the API later.
        diff = this.setLeftParentIds(diff);
        this.diff = diff;
    },
});
