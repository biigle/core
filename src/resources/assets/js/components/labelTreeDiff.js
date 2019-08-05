/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeDiff', {
    template: '<div class="label-tree-diff">' +
        '<div class="label-tree-diff__names">' +
            '<span class="h3" v-text="leftName"></span>' +
            '<span class="h3" v-text="rightName"></span>' +
        '</div>' +
        '<label-tree-diff-row ' +
            'v-for="item in diff" ' +
            ':item="item" '+
            '@resolved="handleResolved" ' +
            '></label-tree-diff-row>' +
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
    },
    computed: {
        leftLabelsAsTree: function () {
            var childMap = this.generateChildMap(this.leftLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
        },
        rightLabelsAsTree: function () {
            var childMap = this.generateChildMap(this.rightLabels);

            return this.generateLabelsAsTree(childMap[null], childMap);
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
                    return a.name <= b.name ? -1 : 1;
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
                        resolved: false,
                        collapsible: left.children.length > 0 || right.children.length > 0,
                        left: left,
                        right: right,
                    });
                    this.generateTreeDiff(left.children, right.children, diff, level + 1);
                } else if (left.name < right.name) {
                    leftLabels.shift();
                    diff.push({
                        level: level,
                        resolved: false,
                        collapsible: left.children.length > 0,
                        left: left,
                        right: null,
                    });
                    this.generateTreeDiff(left.children, [], diff, level + 1);
                } else {
                    rightLabels.shift();
                    diff.push({
                        level: level,
                        resolved: false,
                        collapsible: right.children.length > 0,
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
                        resolved: false,
                        collapsible: label.children.length > 0,
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
                        resolved: false,
                        collapsible: label.children.length > 0,
                        left: null,
                        right: label,
                    });
                    this.generateTreeDiff([], label.children, diff, level + 1);
                }, this);
            }

            return diff;
        },
        filterCollapsedItems: function (diff) {
            var isDifferent = [];

            diff.forEach(function (row, index) {
                row.relevant = row.level !== 0;
                if (row.left === null || row.right === null) {
                    isDifferent.push(index);
                }
            });

            isDifferent.forEach(function (index) {
                if (diff[index].relevant) {
                    diff[index].relevant = false;
                    var currentLevel = diff[index].level;
                    var currentIndex = index;
                    while (currentIndex >= 0 && currentLevel > 0) {
                        if (diff[currentIndex].level < currentLevel) {
                            diff[currentIndex].relevant = false;
                            currentLevel = diff[currentIndex].level;
                        }
                        currentIndex -= 1;
                    }
                }
            });

            return diff.filter(function (row) {
                return !row.relevant;
            });
        },
        handleResolved: function (row) {
            row.resolved = !row.resolved;
        },
    },
    created: function () {
        this.diff = this.filterCollapsedItems(
            this.generateTreeDiff(
                this.leftLabelsAsTree,
                this.rightLabelsAsTree
            )
        );
    },
});
