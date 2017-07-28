/**
 * A variant of the image grid used for the dismiss step of Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.dismissImageGrid', {
    mixins: [biigle.$require('volumes.components.imageGrid')],
    components: {
        imageGridImage: biigle.$require('largo.components.dismissImageGridImage'),
    },
});
