/**
 * A mixin for view models that have a loading state
 *
 * @type {Object}
 */
biigle.$component('labelTrees.mixins.loader', {
    components: {
        loader: biigle.$require('labelTrees.components.loader'),
    },
    data: function () {
        return {
            loading: false,
        };
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
