/**
 * A component for a loading spinner element that acts as blocking overlay
 *
 * @type {Object}
 */
biigle.$component('core.components.loaderBlock', {
    template: '<div class="loader-block" :class="{\'loader-block--active\': active}">' +
        '<loader :active="active" :fancy="true"></loader>' +
    '</div>',
    components: {
        loader: biigle.$require('core.components.loader'),
    },
    props: {
        active: {
            type: Boolean,
            required: true,
        },
    }
});
