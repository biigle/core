/**
 * A variant of the image grid used for the relabel step of Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.relabelImageGrid', {
    mixins: [biigle.$require('volumes.components.imageGrid')],
    components: {
        imageGridImage: biigle.$require('largo.components.relabelImageGridImage'),
    },
});
