/**
 * Mixin for the annotationCanvas component that contains logic for the mouse position indicator.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.mousePosition', function () {
    var map, throttle;

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
                mousePosition: [0, 0],
                // Mouse position in DOM element coordinates.
                mouseDomPosition: [0, 0],
            };
        },
        methods: {
            updateMouseDomPosition: function (e) {
                this.mouseDomPosition = e.pixel;
            },
            updateMousePosition: function (e) {
                var self = this;
                throttle(function () {
                    self.mousePosition = self.invertPointsYAxis(e.coordinate).map(Math.round);
                }, 100, 'annotations.canvas.mouse-position');
            },
        },
        watch: {
            showMousePosition: function (show) {
                if (show) {
                    map.on('pointermove', this.updateMousePosition);
                } else {
                    map.un('pointermove', this.updateMousePosition);
                }
            },
        },
        created: function () {
            map = biigle.$require('annotations.stores.map');
            throttle = biigle.$require('annotations.stores.utils').throttle;
        },
    };
});
