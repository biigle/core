<script>
import LabelTooltip from '../labelTooltip.vue';
import MeasureTooltip from '../measureTooltip.vue';
import {PersistentLabelTooltip, usePersistentLabelTooltips} from '../persistentLabelTooltips.js';
import {computed, markRaw} from 'vue';
import {LABEL_TOOLTIP_MODES} from '../../utils.js';

/**
 * Mixin for the annotationCanvas component that contains logic for the annotation tooltip.
 *
 * @type {Object}
 */
export default {
    components: {
        labelTooltip: LabelTooltip,
        measureTooltip: MeasureTooltip,
        persistentLabelTooltip: PersistentLabelTooltip,
    },
    props: {
        showLabelTooltip: {
            type: String,
            default: LABEL_TOOLTIP_MODES.OFF,
        },
        showMeasureTooltip: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        showAnnotationTooltip() {
            return this.isDefaultInteractionMode && (this.showHoverLabelTooltip || this.showMeasureTooltip);
        },
        showHoverLabelTooltip() {
            return this.showLabelTooltip === LABEL_TOOLTIP_MODES.HOVER;
        },
    },
    data() {
        return {
            // Used to determine when to notify watchers for hovered annotations.
            hoveredFeaturesHash: '',
            hoveredFeatures: [],
            persistentLabelTooltips: null,
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
                // Explicitly mark as raw so the OpenLayers map will not accidentally be
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
        this.persistentLabelTooltips.mount();
        // Wait until the OpenLayers map is created.
        this.updatePointerMoveHandler();
        this.$watch('showAnnotationTooltip', this.updatePointerMoveHandler);
    },
    created() {
        this.persistentLabelTooltips = usePersistentLabelTooltips({
            annotationSource: computed(() => {
                this.mapReadyRevision;
                return this.annotationSource;
            }),
            map: computed(() => this.map),
            mapReadyRevision: computed(() => this.mapReadyRevision),
            mode: computed(() => this.showLabelTooltip),
        });
    },
    beforeUnmount() {
        this.persistentLabelTooltips.unmount();
    },
};
</script>
