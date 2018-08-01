/**
 * Mixin for the annotationCanvas component that contains logic for the measure interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.measureInteraction', function () {
    var measureLayer,
        measureInteraction;

    return {
        data: function () {
            return {
                measureFeature: undefined,
                measureFeaturePosition: [0, 0],
            };
        },
        computed: {
            isMeasuring: function () {
                return this.interactionMode === 'measure';
            },
            measureFeatures: function () {
                if (this.measureFeature) {
                    return [this.measureFeature];
                }

                return [];
            },
            hasMeasureFeature: function () {
                return !!this.measureFeature;
            },
        },
        methods: {
            toggleMeasuring: function () {
                if (this.isMeasuring) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'measure';
                }
            },
            handleMeasureDrawStart: function (e) {
                measureLayer.getSource().clear();
                this.measureFeature = e.feature;
            },
            updateMeasureFeaturePosition: function (e) {
                this.measureFeaturePosition = e.target.getLastCoordinate();
            },
        },
        watch: {
            isMeasuring: function (measuring) {
                if (measuring) {
                    this.map.addLayer(measureLayer);
                    this.map.addInteraction(measureInteraction);
                } else {
                    measureLayer.getSource().clear();
                    this.measureFeature = undefined;
                    this.map.removeLayer(measureLayer);
                    this.map.removeInteraction(measureInteraction);
                }
            },
            measureFeature: function (feature) {
                if (feature) {
                    var geom = feature.getGeometry();
                    // Set initial tooltip position.
                    this.updateMeasureFeaturePosition({target: geom});
                    geom.on('change', this.updateMeasureFeaturePosition);
                }
            },
        },
        created: function () {
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
            biigle.$require('keyboard').on('F', this.toggleMeasuring);
        },
    };
});
