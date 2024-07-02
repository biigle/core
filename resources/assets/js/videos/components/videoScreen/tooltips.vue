<script>
import LabelTooltip from '../../../annotations/components/labelTooltip';

/**
 * Mixin for the videoScreen component that contains logic for the tooltips.
 *
 * @type {Object}
 */
export default {
    components: {
        labelTooltip: LabelTooltip,
    },
    data() {
        return {
            // Used to determine when to notify watchers for hovered annotations.
            hoveredFeaturesHash: '',
        };
    },
    computed: {
        showTooltip() {
            return this.isDefaultInteractionMode && this.showLabelTooltip;
        },
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
        updateTooltipEventListeners() {
            if (this.showTooltip) {
                this.map.on('pointermove', this.updateHoveredAnnotations);
            } else {
                this.map.un('pointermove', this.updateHoveredAnnotations);
                this.resetHoveredAnnotations();
            }
        },
    },
    watch: {
        showTooltip() {
            this.updateTooltipEventListeners();
        },
    },
    created() {
        this.$once('map-created', this.updateTooltipEventListeners);
    },
};
</script>
