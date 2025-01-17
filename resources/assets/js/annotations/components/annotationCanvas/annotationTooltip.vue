<script>
import LabelTooltip from '../labelTooltip.vue';
import MeasureTooltip from '../measureTooltip.vue';

/**
 * Mixin for the annotationCanvas component that contains logic for the annotation tooltip.
 *
 * @type {Object}
 */
export default {
    emits: ['hoverFeatures'],
    components: {
        labelTooltip: LabelTooltip,
        measureTooltip: MeasureTooltip,
    },
    props: {
        showLabelTooltip: {
            type: Boolean,
            default: false,
        },
        showMeasureTooltip: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        showAnnotationTooltip() {
            return this.isDefaultInteractionMode && (this.showLabelTooltip || this.showMeasureTooltip);
        },
    },
    data() {
        return {
            // Used to determine when to notify watchers for hovered annotations.
            hoveredFeaturesHash: '',
        };
    },
    methods: {
        annotationLayerFilter(layer) {
            return layer.get('name') === 'annotations';
        },
        updateHoveredAnnotations(e) {
            let features = this.map.getFeaturesAtPixel(e.pixel, {layerFilter: this.annotationLayerFilter});
            let hash = features.map((f) => f.getId()).join('-');

            if (this.hoveredFeaturesHash !== hash) {
                this.hoveredFeaturesHash = hash;
                this.$emit('hoverFeatures', features);
            }
        },
        resetHoveredAnnotations() {
            this.hoveredFeaturesHash = '';
            this.$emit('hoverFeatures', []);
        },
    },
    watch: {
        showAnnotationTooltip(show) {
            if (show) {
                this.map.on('pointermove', this.updateHoveredAnnotations);
            } else {
                this.map.un('pointermove', this.updateHoveredAnnotations);
                this.resetHoveredAnnotations();
            }
        },
    },
};
</script>
