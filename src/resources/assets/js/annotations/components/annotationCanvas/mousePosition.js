/**
 * Mixin for the annotationCanvas component that contains logic for the mouse position indicator.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.mousePosition', function () {
    var throttle;

    return {
        components: {
            mousePositionIndicator: biigle.$require('annotations.components.mousePositionIndicator'),
        },
        props: {
            showMousePosition: {
                type: Boolean,
                default: false,
            },
        },
        data: function () {
            return {
                // Mouse position in image coordinates.
                mousePositionIC: [0, 0],
            };
        },
        watch: {
            mousePosition: function (position) {
                var self = this;
                throttle(function () {
                    // Make sure to copy the array with slice before inverting the axis.
                    self.mousePositionIC = self.invertPointsYAxis(position.slice()).map(Math.round);
                }, 100, 'annotations.canvas.mouse-position-ic');
            },
        },
        created: function () {
            throttle = biigle.$require('annotations.stores.utils').throttle;
        },
    };
});
