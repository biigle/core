/**
 * Mixin for the annotationCanvas component that contains logic for random/regular sampling.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.sampling', function () {
    var map;
    var crosshairLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: [
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 4
                    })
                })
            }),
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    stroke: new ol.style.Stroke({
                        color: [0, 153, 255, 1],
                        width: 2,
                        lineDash: [3]
                    })
                })
            }),
        ],
        zIndex: 3,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
    });
    var crosshairFeature = new ol.Feature(new ol.geom.Point([0, 0]));
    crosshairLayer.getSource().addFeature(crosshairFeature);
    crosshairLayer.setVisible(false);

    return {
        data: function () {
            return {
                regularSamplingRows: null,
                regularSamplingColumns: null,
                currentRegularSamplingIndex: null,
            };
        },
        computed: {
            regularSamplingLocations: function () {
                var stepSize = [
                    this.image.width / this.regularSamplingColumns,
                    this.image.height / this.regularSamplingRows
                ];
                var start = [stepSize[0] / 2, stepSize[1] / 2];

                var locations = [];

                for (var i = this.regularSamplingColumns - 1; i >= 0; i--) {
                    for (var j = this.regularSamplingRows - 1; j >= 0; j--) {
                        locations.unshift([
                            start[0] + j * stepSize[0],
                            start[1] + i * stepSize[1],
                        ]);
                    }
                }

                return locations;
            },
            isSamplingAnnotationMode: function () {
                return this.annotationMode.endsWith('Sampling');
            },
        },
        methods: {
            setRegularSamplingData: function (rows, cols) {
                this.regularSamplingRows = rows;
                this.regularSamplingColumns = cols;
            },
            showRegularSamplingLocation: function (index) {
                if (index >= 0 && index < this.regularSamplingLocations.length) {
                    map.getView().setCenter(this.regularSamplingLocations[index]);
                    crosshairFeature.getGeometry().setCoordinates(this.regularSamplingLocations[index]);
                }
            },
            showFirstRegularSamplingLocation: function () {
                this.currentRegularSamplingIndex = 0;
            },
            showLastRegularSamplingLocation: function () {
                this.currentRegularSamplingIndex = this.regularSamplingLocations.length - 1;
            },
            showPreviousRegularSamplingLocation: function () {
                var value = this.currentRegularSamplingIndex - 1;
                if (value < 0) {
                    return false;
                }

                this.currentRegularSamplingIndex = value;

                return true;
            },
            showNextRegularSamplingLocation: function () {
                var value = this.currentRegularSamplingIndex + 1;
                if (value >= this.regularSamplingLocations.length) {
                    return false;
                }

                this.currentRegularSamplingIndex = value;

                return true;
            },
            createRegularlySampledAnnotation: function () {
                var location = this.regularSamplingLocations[this.currentRegularSamplingIndex];
                this.createPointAnnotationAt(location[0], location[1]);
            },
        },
        watch: {
            currentRegularSamplingIndex: function (index) {
                this.showRegularSamplingLocation(index);
            },
            isSamplingAnnotationMode: function (is) {
                if (is) {
                    crosshairLayer.setVisible(true);
                } else {
                    crosshairLayer.setVisible(false);
                }
            },
        },
        created: function () {
            map = biigle.$require('annotations.stores.map');
            map.addLayer(crosshairLayer);
        },
    };
});
