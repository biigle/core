/**
 * A component for a loading spinner
 *
 * @type {Object}
 */
biigle.$component('core.components.loader', {
    template: '<span class="loader" :class="{\'loader--active\': active, \'loader--fancy\': fancy}"></span>',
    props: {
        active: {
            type: Boolean,
            required: true,
        },
        fancy: {
            type: Boolean,
            default: false,
        }
    }
});
