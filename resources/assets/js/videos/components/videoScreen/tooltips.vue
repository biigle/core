<script>
import LabelTooltip from '@/annotations/components/labelTooltip.vue';
import {markRaw} from 'vue';

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
            hoveredFeatures: [],
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
