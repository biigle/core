<script>
import MousePositionIndicator from '../mousePositionIndicator.vue';
import {throttle} from '@/core/utils.js';

/**
 * Mixin for the annotationCanvas component that contains logic for the mouse position indicator.
 *
 * @type {Object}
 */
export default {
    components: {
        mousePositionIndicator: MousePositionIndicator,
    },
    props: {
        showMousePosition: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            // Mouse position in image coordinates.
            mousePositionIC: [0, 0],
        };
    },
    watch: {
        mousePosition(position) {
            throttle(() => {
                // Make sure to copy the array with slice before inverting the axis.
                this.mousePositionIC = this.invertPointsYAxis(position.slice()).map(Math.round);
            }, 100, 'annotations.canvas.mouse-position-ic');
        },
    },
};
</script>
