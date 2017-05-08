/**
 * The labels tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.labelsTab', {
    components: {
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
    },
    data: function () {
        return {
            labelTrees: biigle.$require('annotations.labelTrees'),
        };
    },
    methods: {
        handleSelectedLabel: function (label) {

        },
        handleDeselectedLabel: function (label) {

        },
    }
});
