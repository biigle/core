/**
 * A component for a loading spinner
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.loader', {
    template: '<span class="loader" :class="{\'loader--active\': active}"></span>',
    props: {
        active: {
            type: Boolean,
            required: true,
        }
    }
});
