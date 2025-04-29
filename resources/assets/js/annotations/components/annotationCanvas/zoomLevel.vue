<script>
import ZoomLevelIndicator from '../zoomLevelIndicator.vue';

/**
 * Mixin for the annotationCanvas component that contains logic for the zoom level indicator.
 *
 * @type {Object}
 */
export default {
    components: {
        zoomLevelIndicator: ZoomLevelIndicator,
    },
    props: {
        showZoomLevel: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
