/**
 * A component for a loading spinner
 *
 * @type {Object}
 */
biigle.$component('core.components.loader', {
    template: '<span class="loader" :class="{\'loader--active\': active}"></span>',
    props: {
        active: {
            type: Boolean,
            required: true,
        }
    }
});
