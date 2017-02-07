/**
 * A component that displays a grid of lots of images for Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.dismissImageGrid', {
    mixins: [biigle.$require('largo.components.imageGrid')],
    components: {
        imageGridImage: biigle.$require('largo.components.dismissImageGridImage'),
    },
});
