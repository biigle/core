/**
 * A variant of the image grid used for the annotation catalog
 *
 * @type {Object}
 */
biigle.$component('largo.components.catalogImageGrid', {
    mixins: [biigle.$require('volumes.components.imageGrid')],
    components: {
        imageGridImage: biigle.$require('largo.components.catalogImageGridImage'),
    },
});
