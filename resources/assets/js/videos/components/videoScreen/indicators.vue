<script>
import MousePositionIndicator from '../../../annotations/components/mousePositionIndicator';
import {throttle} from '../../../core/utils';

/**
 * Mixin for the videoScreen component that contains logic for the indicators.
 *
 * @type {Object}
 */
export default {
    components: {
        mousePositionIndicator: MousePositionIndicator,
    },
    data() {
        return {
            // Mouse position in image coordinates.
            mousePositionImageCoordinates: [0, 0],
        };
    },
    methods: {
        updateMousePositionImageCoordinates() {
            // Make sure to copy the array with slice before inverting the axis.
            this.mousePositionImageCoordinates = this.invertPointsYAxis(this.mousePosition.slice()).map(Math.round);
        },
    },
    watch: {
        mousePosition() {
            throttle(this.updateMousePositionImageCoordinates, 100, 'videos.update-mouse-position-ic');
        },
    },
};
</script>
