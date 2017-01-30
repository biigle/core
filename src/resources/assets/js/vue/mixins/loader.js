/**
 * A mixin for view models that have a loading state
 *
 * @type {Object}
 */
biigle.$component('labelTrees.mixins.loader', {
    data: {
        loading: false,
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
