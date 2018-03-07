/**
 * Mixin for the annotationCanvas component that contains logic for the scale line indicator.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.scaleLine', function () {
    return {
        components: {
            scaleLineIndicator: biigle.$require('annotations.components.scaleLineIndicator'),
        },
        props: {
            showScaleLine: {
                type: Boolean,
                default: false,
            },
        },
    };
});
