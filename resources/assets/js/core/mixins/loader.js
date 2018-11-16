/**
 * A mixin for view models that have a loading state
 *
 * @type {Object}
 */
biigle.$component('core.mixins.loader', {
    components: {
        loader: biigle.$require('core.components.loader'),
        loaderBlock: biigle.$require('core.components.loaderBlock'),
    },
    data: function () {
        return {
            instancesLoading: 0,
        };
    },
    computed: {
        loading: function () {
            return this.instancesLoading > 0;
        },
    },
    watch: {
        loading: function (loading) {
            this.$emit('loading', loading);
        },
    },
    methods: {
        startLoading: function () {
            this.instancesLoading += 1;
        },
        finishLoading: function () {
            if (this.instancesLoading > 0) {
                this.instancesLoading -= 1;
            }
        },
    },
});
