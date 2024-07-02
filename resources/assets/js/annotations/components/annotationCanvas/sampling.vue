<script>
import Circle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

let crosshairLayer;
let crosshairFeature;

/**
 * Mixin for the annotationCanvas component that contains logic for random/regular sampling.
 *
 * @type {Object}
 */
export default {
    data() {
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
        regularSamplingLocations() {
            let stepSize = [
                this.image.width / this.regularSamplingColumns,
                this.image.height / this.regularSamplingRows
            ];
            let start = [stepSize[0] / 2, stepSize[1] / 2];

            let locations = [];

            for (let i = this.regularSamplingRows - 1; i >= 0; i--) {
                for (let j = this.regularSamplingColumns - 1; j >= 0; j--) {
                    locations.unshift([
                        start[0] + j * stepSize[0],
                        start[1] + i * stepSize[1],
                    ]);
                }
            }

            return locations;
        },
        randomSamplingLocations() {
            /* eslint-disable vue/no-side-effects-in-computed-properties */
            if (!this.randomLocationMemory.hasOwnProperty(this.image.id)) {
                let locations = [];
                let width = this.image.width;
                let height = this.image.height;

                for (let i = this.randomSamplingCount; i > 0; i--) {
                    locations.push([
                        Math.round(Math.random() * width),
                        Math.round(Math.random() * height),
                    ]);
                }

                this.randomLocationMemory[this.image.id] = locations;
            }

            return this.randomLocationMemory[this.image.id];
        },
        samplingLocations() {
            return this[this.annotationMode + 'Locations'];
        },
        isSamplingAnnotationMode() {
            return this.annotationMode.endsWith('Sampling');
        },
    },
    methods: {
        setSamplingData(mode, data) {
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
        updateShownSamplingLocation() {
            let index = this.currentSamplingIndex;
            if (index !== null && index >= 0 && index < this.samplingLocations.length) {
                this.map.getView().setCenter(this.samplingLocations[index]);
                crosshairFeature.getGeometry().setCoordinates(this.samplingLocations[index]);
            }
        },
        showFirstSamplingLocation() {
            this.currentSamplingIndex = 0;
            this.updateShownSamplingLocation();
        },
        showLastSamplingLocation() {
            this.currentSamplingIndex = this.samplingLocations.length - 1;
            this.updateShownSamplingLocation();
        },
        showPreviousSamplingLocation() {
            let value = this.currentSamplingIndex - 1;
            if (value < 0) {
                return false;
            }

            this.currentSamplingIndex = value;
            this.updateShownSamplingLocation();

            return true;
        },
        showNextSamplingLocation() {
            let value = this.currentSamplingIndex + 1;
            if (value >= this.samplingLocations.length) {
                return false;
            }

            this.currentSamplingIndex = value;
            this.updateShownSamplingLocation();

            return true;
        },
        createSampledAnnotation() {
            let location = this.samplingLocations[this.currentSamplingIndex];
            this.createPointAnnotationAt(location[0], location[1]);
        },
    },
    watch: {
        isSamplingAnnotationMode(is) {
            if (is) {
                this.map.addLayer(crosshairLayer);
            } else {
                this.map.removeLayer(crosshairLayer);
            }
        },
        randomSamplingCount() {
            // Clear memory if sampling count changed. Compute new locations in this
            // case.
            this.randomLocationMemory = {};
        },
    },
    created() {
        crosshairLayer = new VectorLayer({
            source: new VectorSource(),
            style: [
                new Style({
                    image: new Circle({
                        radius: 6,
                        stroke: new Stroke({
                            color: 'white',
                            width: 4
                        })
                    })
                }),
                new Style({
                    image: new Circle({
                        radius: 6,
                        stroke: new Stroke({
                            color: [0, 153, 255, 1],
                            width: 2,
                            lineDash: [3]
                        })
                    })
                }),
            ],
            zIndex: 90,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
        });
        crosshairFeature = new Feature(new Point([0, 0]));
        crosshairLayer.getSource().addFeature(crosshairFeature);
    },
};
</script>
