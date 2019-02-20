/**
 * View model for the volume filter tab
 */
biigle.$component('volumes.components.labelsTab', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
        powerToggle: biigle.$require('core.components.powerToggle'),
    },
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
        showLabels: {
            type: Boolean,
            default: false,
        },
        loadingLabels: {
            type: Boolean,
            default: false,
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
        enableLabels: function () {
            this.$emit('enable-labels');
        },
        disableLabels: function () {
            this.$emit('disable-labels');
        },
    },
});
