<script>
import LabelTooltip from '../labelTooltip.vue';
import MeasureTooltip from '../measureTooltip.vue';
import {markRaw} from 'vue';

/**
 * Mixin for the annotationCanvas component that contains logic for the annotation tooltip.
 *
 * @type {Object}
 */
export default {
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
            hoveredFeatures: [],
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
                // Explixitly mark as raw so the OpenLayers map will not accidentally be
                // made reactive.
                // See: https://github.com/biigle/annotations/issues/108
                this.hoveredFeatures = markRaw(features);
            }
        },
        resetHoveredAnnotations() {
            this.hoveredFeaturesHash = '';
            this.hoveredFeatures = [];
        },
        updatePointerMoveHandler() {
            if (this.showAnnotationTooltip) {
                this.map.on('pointermove', this.updateHoveredAnnotations);
            } else {
                this.map.un('pointermove', this.updateHoveredAnnotations);
                this.resetHoveredAnnotations();
            }
        },
    },
    mounted() {
        // Wait until the OpenLayers map is created.
        this.updatePointerMoveHandler();
        this.$watch('showAnnotationTooltip', this.updatePointerMoveHandler);
    },
};
</script>
