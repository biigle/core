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
        zIndex: 110,
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
                currentSamplingIndex: null,
                randomSamplingCount: null,
                // Store random locations for each image here so they remain consistent
                // for one session (e.g. if the user wants to go back).
                randomLocationMemory: {},
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
            randomSamplingLocations: function () {
                if (!this.randomLocationMemory.hasOwnProperty(this.image.id)) {
                    var locations = [];
                    var width = this.image.width;
                    var height = this.image.height;

                    for (var i = this.randomSamplingCount; i > 0; i--) {
                        locations.push([
                            Math.round(Math.random() * width),
                            Math.round(Math.random() * height),
                        ]);
                    }

                    this.randomLocationMemory[this.image.id] = locations;
                }

                return this.randomLocationMemory[this.image.id];
            },
            samplingLocations: function () {
                return this[this.annotationMode + 'Locations'];
            },
            isSamplingAnnotationMode: function () {
                return this.annotationMode.endsWith('Sampling');
            },
        },
        methods: {
            setSamplingData: function (mode, data) {
                if (mode === 'regularSampling') {
                    if (Array.isArray(data) && data[0] > 0 && data[1] > 0) {
                        this.regularSamplingRows = data[0];
                        this.regularSamplingColumns = data[1];
                    }
                } else if (mode === 'randomSampling') {
                    if (data > 0) {
                        this.randomSamplingCount = data;
                    }
                }
            },
            updateShownSamplingLocation: function () {
                var index = this.currentSamplingIndex;
                if (index !== null && index >= 0 && index < this.samplingLocations.length) {
                    map.getView().setCenter(this.samplingLocations[index]);
                    crosshairFeature.getGeometry().setCoordinates(this.samplingLocations[index]);
                }
            },
            showFirstSamplingLocation: function () {
                this.currentSamplingIndex = 0;
                this.updateShownSamplingLocation();
            },
            showLastSamplingLocation: function () {
                this.currentSamplingIndex = this.samplingLocations.length - 1;
                this.updateShownSamplingLocation();
            },
            showPreviousSamplingLocation: function () {
                var value = this.currentSamplingIndex - 1;
                if (value < 0) {
                    return false;
                }

                this.currentSamplingIndex = value;
                this.updateShownSamplingLocation();

                return true;
            },
            showNextSamplingLocation: function () {
                var value = this.currentSamplingIndex + 1;
                if (value >= this.samplingLocations.length) {
                    return false;
                }

                this.currentSamplingIndex = value;
                this.updateShownSamplingLocation();

                return true;
            },
            createSampledAnnotation: function () {
                var location = this.samplingLocations[this.currentSamplingIndex];
                this.createPointAnnotationAt(location[0], location[1]);
            },
        },
        watch: {
            isSamplingAnnotationMode: function (is) {
                crosshairLayer.setVisible(is);
            },
            randomSamplingCount: function () {
                // Clear memory if sampling count changed. Compute new locations in this
                // case.
                this.randomLocationMemory = {};
            },
        },
        created: function () {
            map = biigle.$require('annotations.stores.map');
            map.addLayer(crosshairLayer);
        },
    };
});
