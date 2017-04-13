/**
 * View model for the volume filter tab
 */
biigle.$component('volumes.components.labelsTab', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
    },
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
    },
    data: function () {
        return {
            labelTrees: biigle.$require('volumes.labelTrees'),
        };
    },
    methods: {
        handleSelectedLabel: function (label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel: function (label) {
            this.$emit('deselect', label);
        },
    },
});
