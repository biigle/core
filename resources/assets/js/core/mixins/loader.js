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
            loading: false,
        };
    },
    watch: {
        loading: function (loading) {
            this.$emit('loading', loading);
        },
    },
    methods: {
        startLoading: function () {
            this.loading = true;
        },
        finishLoading: function () {
            this.loading = false;
        },
    },
});
