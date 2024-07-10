<script>
import Overlay from '@biigle/ol/Overlay';

/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
export default {
    props: {
        watch: {
            required: true,
            type: String,
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
        show: {
            immediate: true,
            handler(show) {
                // Do NOT pass the features as prop of this component because this would
                // make them reactive. As the features store a reference back to the map,
                // EVERYTHING would be made reactive.
                // See: https://github.com/biigle/annotations/issues/108
                if (show) {
                    this.$parent.$on(this.watch, this.updateAnnotations);
                } else {
                    this.$parent.$off(this.watch, this.updateAnnotations);
                }

            },
        },
        position(position) {
            this.overlay.setPosition(position);
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
    beforeDestroy() {
        this.$parent.map.removeOverlay(this.overlay);
    },
};
</script>
