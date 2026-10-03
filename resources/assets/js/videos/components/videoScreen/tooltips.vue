<script>
import LabelTooltip from '@/annotations/components/labelTooltip.vue';
import {PersistentLabelTooltip, usePersistentLabelTooltips} from '@/annotations/components/persistentLabelTooltips.js';
import {computed, markRaw} from 'vue';
import {LABEL_TOOLTIP_MODES} from '@/annotations/utils.js';

/**
 * Mixin for the videoScreen component that contains logic for the tooltips.
 *
 * @type {Object}
 */
export default {
    components: {
        labelTooltip: LabelTooltip,
        persistentLabelTooltip: PersistentLabelTooltip,
    },
    data() {
        return {
            // Used to determine when to notify watchers for hovered annotations.
            hoveredFeaturesHash: '',
            hoveredFeatures: [],
            persistentLabelTooltips: null,
        };
    },
    computed: {
        showTooltip() {
            return this.isDefaultInteractionMode && this.showLabelTooltip === LABEL_TOOLTIP_MODES.HOVER;
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
        map: {
            once: true,
            handler() {
                this.updateTooltipEventListeners(this.map);
            },
        },
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
    mounted() {
        this.persistentLabelTooltips.mount();
    },
    beforeUnmount() {
        this.persistentLabelTooltips.unmount();
    },
};
</script>
