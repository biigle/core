/**
 * Mixin for the annotationCanvas component that contains logic for the measure interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.measureInteraction', function () {
    var measureLayer,
        measureInteraction;

    return {
        data() {
            return {
                hasMeasureFeature: false,
                measureFeaturePosition: [0, 0],
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
                } else {
                    this.interactionMode = 'measure';
                }
            },
            handleMeasureDrawStart(e) {
                measureLayer.getSource().clear();
                this.setMeasureFeature(e.feature);
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
        },
        watch: {
            isMeasuring(measuring) {
                if (measuring) {
                    this.map.addLayer(measureLayer);
                    this.map.addInteraction(measureInteraction);
                    this.$emit('measuring');
                } else {
                    measureLayer.getSource().clear();
                    this.setMeasureFeature(undefined);
                    this.map.removeLayer(measureLayer);
                    this.map.removeInteraction(measureInteraction);
                }
            },
            image() {
                if (this.isMeasuring) {
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
            measureLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: biigle.$require('annotations.stores.styles').editing,
                zIndex: 200,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
            });
            measureInteraction = new ol.interaction.Draw({
                source: measureLayer.getSource(),
                type: 'LineString',
                style: measureLayer.getStyle(),
            });
            measureInteraction.on('drawstart', this.handleMeasureDrawStart);
            biigle.$require('keyboard').on('Shift+f', this.toggleMeasuring, 0, this.listenerSet);

            // Do not make this reactive.
            // See: https://github.com/biigle/annotations/issues/108
            this.measureFeature = undefined;
        },
    };
});
