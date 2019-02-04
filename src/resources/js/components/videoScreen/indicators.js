/**
 * Mixin for the videoScreen component that contains logic for the indicators.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.indicators', function () {
    return {
        components: {
            mousePositionIndicator: biigle.$require('annotations.components.mousePositionIndicator'),
        },
        data: function () {
            return {
                // Mouse position in image coordinates.
                mousePositionImageCoordinates: [0, 0],
            };
        },
        computed: {
            //
        },
        methods: {
            updateMousePositionImageCoordinates: function () {
                // Make sure to copy the array with slice before inverting the axis.
                this.mousePositionImageCoordinates = this.invertPointsYAxis(this.mousePosition.slice()).map(Math.round);
            },
        },
        watch: {
            mousePosition: function (position) {
                biigle.$require('annotations.stores.utils').throttle(this.updateMousePositionImageCoordinates, 100, 'videos.update-mouse-position-ic');
            },
        },
        created: function () {
            //
        },
    };
});
