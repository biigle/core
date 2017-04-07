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
    computed: {
    },
    methods: {
        handleSelectedLabel: function (label) {

        },
        handleDeselectedLabel: function (label) {

        },
    },
    watch: {
    },
    created: function () {
    },
});
