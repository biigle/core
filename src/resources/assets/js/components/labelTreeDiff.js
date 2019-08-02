/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeDiff', {
    template: '<div class="label-tree-diff">' +

    '</div>',
    data: function () {
        return {
            //
        };
    },
    props: {
        leftLabels: {
            type: Array,
            required: true,
        },
        rightLabels: {
            type: Array,
            required: true,
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
        diff: function () {
            return this.generateTreeDiff(this.leftLabelsAsTree, this.rightLabelsAsTree);
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
        generateTreeDiff: function (leftLabels, rightLabels) {
            leftLabels = leftLabels.slice();
            rightLabels = rightLabels.slice();
            var diff = [];

            while (leftLabels.length > 0 && rightLabels.length > 0) {
                var left = leftLabels[0];
                var right = rightLabels[0];
                if (left.name === right.name) {
                    diff.push({
                        left: leftLabels.shift(),
                        right: rightLabels.shift(),
                        diff: this.generateTreeDiff(left.children, right.children, diff),
                    });
                } else if (left.name < right.name) {
                    diff.push({
                        left: leftLabels.shift(),
                        right: null,
                        diff: [],
                    });
                } else {
                    diff.push({
                        left: null,
                        right: rightLabels.shift(),
                        diff: [],
                    });
                }
            }

            if (leftLabels.length > 0) {
                leftLabels.forEach(function (label) {
                    diff.push({left: label, right: null, diff: []});
                });
            }

            if (rightLabels.length > 0) {
                rightLabels.forEach(function (label) {
                    diff.push({left: null, right: label, diff: []});
                });
            }

            return diff;
        },
    },
    created: function () {
        console.log(this.diff);
    },
});
