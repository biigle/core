/**
 * A variant of the image grid used to display vomule images
 *
 * @type {Object}
 */
biigle.$component('volumes.components.volumeImageGrid', {
    mixins: [biigle.$require('volumes.components.imageGrid')],
    components: {
        imageGridImage: biigle.$require('volumes.components.volumeImageGridImage'),
    },
});
