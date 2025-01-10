<script>
import DrawInteraction from '@biigle/ol/interaction/Draw';
import Keyboard from '@/core/keyboard.vue';
import Styles from '@/annotations/stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';

/**
 * Mixin for the annotationCanvas component that contains logic for the measure interaction.
 *
 * @type {Object}
 */
let measureLayer;
let measureInteraction;

export default {
    data() {
        return {
            hasMeasureFeature: false,
            measureFeaturePosition: [0, 0],
            cantConvertMeasureFeature: true,
        };
    },
    computed: {
        isMeasuring() {
            return this.interactionMode === 'measure';
        },
    },
    methods: {
        toggleMeasuring() {
            if (this.isMeasuring) {
                this.resetInteractionMode();
            } else if (this.image) {
                this.interactionMode = 'measure';
            }
        },
        handleMeasureDrawStart(e) {
            measureLayer.getSource().clear();
            this.setMeasureFeature(e.feature);
            this.cantConvertMeasureFeature = true;
        },
        handleMeasureDrawEnd() {
            this.cantConvertMeasureFeature = false;
        },
        updateMeasureFeature(e) {
            this.measureFeaturePosition = e.target.getGeometry().getLastCoordinate();
            this.$emit('changeMeasureFeature', [e.target]);
        },
        setMeasureFeature(feature) {
            this.measureFeature = feature;
            this.hasMeasureFeature = !!feature;

            if (feature) {
                // Set initial tooltip position.
                this.updateMeasureFeature({target: feature});
                feature.on('change', this.updateMeasureFeature);
            }
        },
        convertMeasurement() {
            if (this.isMeasuring && !this.cantConvertMeasureFeature) {
                if (!this.hasSelectedLabel) {
                    this.requireSelectedLabel(false);
                } else {
                    this.annotationSource.addFeature(this.measureFeature);
                    this.handleNewFeature({feature: this.measureFeature});
                    this.clearMeasureFeature();
                }
            }
        },
        clearMeasureFeature() {
            this.setMeasureFeature(undefined);
            measureLayer.getSource().clear();
            this.cantConvertMeasureFeature = true;
        }
    },
    watch: {
        isMeasuring(measuring) {
            if (measuring) {
                this.map.addLayer(measureLayer);
                this.map.addInteraction(measureInteraction);
                this.$emit('measuring');
            } else {
                this.clearMeasureFeature();
                this.map.removeLayer(measureLayer);
                this.map.removeInteraction(measureInteraction);
            }
        },
        image() {
            if (this.isMeasuring && this.image) {
                // Wait for the new image to be propagated down to the measureTooltip
                // then update it. We have to do this manually since we don't want to
                // process the OpenLayers features reactively (see below).
                this.$nextTick(function () {
                    this.updateMeasureFeature({target: this.measureFeature});
                });
            }
        },
    },
    created() {
        measureLayer = new VectorLayer({
            source: new VectorSource(),
            style: Styles.editing,
            zIndex: 200,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
        });
        measureInteraction = new DrawInteraction({
            source: measureLayer.getSource(),
            type: 'LineString',
            style: measureLayer.getStyle(),
        });
        measureInteraction.on('drawstart', this.handleMeasureDrawStart);
        measureInteraction.on('drawend', this.handleMeasureDrawEnd);
        Keyboard.on('Shift+f', this.toggleMeasuring, 0, this.listenerSet);
        Keyboard.on('Enter', this.convertMeasurement, 0, this.listenerSet)

        // Do not make this reactive.
        // See: https://github.com/biigle/annotations/issues/108
        this.measureFeature = undefined;
    },
};
</script>
