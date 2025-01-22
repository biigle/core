<script>
import Overlay from '@biigle/ol/Overlay';

/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
export default {
    props: {
        features: {
            required: true,
            type: Array,
        },
        position: {
            required: true,
            type: Array,
        },
        show: {
            required: true,
            type: Boolean,
        },
        positioning: {
            type: String,
            default: 'top-left',
        },
    },
    data() {
        return {
            annotations: [],
        };
    },
    computed: {
        hasAnnotations() {
            return this.annotations.length > 0;
        },
        showThis() {
            return this.show && this.hasAnnotations;
        },
    },
    methods: {
        updateAnnotations(features) {
            this.annotations = features.map(function (feature) {
                return feature.get('annotation');
            });
        },
    },
    watch: {
        // This is a shallow array watcher on purpose.
        features(features) {
            if (this.show) {
                this.updateAnnotations(features);
            }
        },
        position: {
            deep: true,
            handler(position) {
                this.overlay.setPosition(position);
            },
        },
        showThis(show) {
            if (show) {
                this.$parent.map.addOverlay(this.overlay);
            } else {
                this.$parent.map.removeOverlay(this.overlay);
            }
        },
    },
    mounted() {
        this.overlay = new Overlay({
            element: this.$el,
            offset: [15, 0],
            positioning: this.positioning,
        });
    },
    beforeUnmount() {
        this.$parent.map.removeOverlay(this.overlay);
    },
};
</script>
