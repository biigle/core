/**
 * Mixin for the annotationCanvas component that contains logic for the zoom level indicator.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.zoomLevel', function () {
    return {
        props: {
            showZoomLevel: {
                type: Boolean,
                default: false,
            },
        },
        components: {
            zoomLevelIndicator: biigle.$require('annotations.components.zoomLevelIndicator'),
        },
    };
});
