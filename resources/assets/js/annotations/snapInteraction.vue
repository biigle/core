<script>
import { Feature } from '@biigle/ol';
import LineString from '@biigle/ol/geom/LineString';
import { Snap } from '@biigle/ol/interaction';
import Keyboard from '../core/keyboard';

export default {
    data() {
        return {
            snapInteraction: null,
            snapLineFeatures: [],
            shouldSnap: false,
        }
    },
    computed: {
        drawsOnImage() {
            return this.startingCoordinates[0] >= 0 && this.startingCoordinates[1] >= 0
                && this.startingCoordinates[0] <= this.width && this.startingCoordinates[1] <= this.height;
        },
        width() {
            return this.image ? this.image.width : this.video.videoWidth;
        },
        height() {
            return this.image ? this.image.height : this.video.videoHeight;
        }
    },
    methods: {
        drawSnaplines() {
            let x = this.startingCoordinates[0];
            let y = this.startingCoordinates[1];

            // Line computation from https://github.com/iamgeoknight/OpenLayersSnapping/blob/main/script.js
            // Creating 8 line features perpendicular to x/y axis.
            [0, 45, 90, 135, 180, 225, 270, 315].forEach(angle => {
                let rad = (angle * Math.PI) / 180;
                let xx = x + (100000 * Math.cos(rad));
                let yy = y + (100000 * Math.sin(rad));
                let v = this.cropLine([[x, y], [xx, yy]], angle);
                let feature = new Feature({ geometry: new LineString(v) });
                this.snapLineFeatures.push(feature);
            });
            this.annotationSource.addFeatures(this.snapLineFeatures);

        },
        cropLine(u, angle) {
            let res = [...u]; // copy u
            let deltav = [u[1][0] - u[0][0], u[1][1] - u[0][0]];

            // Linear combination of u
            let snapLineVec = (t) => [u[0][0] + t * deltav[0], u[0][1] + t * deltav[1]];

            if ([45, 135, 225, 315].includes(angle)) {
                let xdiff = this.width - u[0][0];
                // Check vector height at borders
                let t0 = angle === 45 || angle === 315 ? xdiff / deltav[0] : -(u[0][0] / deltav[0]);
                let v1 = snapLineVec(t0);
                if (angle === 45 || angle === 135) {
                    // y exceeds height => intersection with horizontal border
                    if (v1[1] > this.height) {
                        let ydiff = this.height - u[0][1];
                        let t0 = ydiff / deltav[1];
                        v1 = snapLineVec(t0);
                        res[1] = v1;
                    } else {
                        res[1] = v1;
                        return res;
                    }
                } else {
                    if (v1[1] < 0) {
                        let t0 = -(u[0][1] / deltav[1]);
                        v1 = snapLineVec(t0);
                        res[1] = v1;
                    } else {
                        res[1] = v1;
                        return res;
                    }
                }
            }
            else if (angle === 0 || angle === 180) {
                res[1] = angle === 0 ? [this.width, res[1][1]] : [0, res[1][1]];
            }
            else {
                res[1] = angle === 90 ? [res[1][0], this.height] : [res[1][0], 0]
            }
            return res;
        },
        startSnap() {
            this.snapInteraction = new Snap({ source: this.annotationSource });
            this.map.addInteraction(this.snapInteraction);
            this.drawSnaplines();
        },
        endSnap() {
            this.snapLineFeatures.map((f) => this.annotationSource.removeFeature(f));
            this.map.removeInteraction(this.snapInteraction);
            this.snapInteraction = undefined;
            this.snapLineFeatures = [];
        },
    },
    watch: {
        startedDrawing() {
            // Passes information that 'drawend' event was fired
            if (!this.startedDrawing) {
                this.shouldSnap = false;
            }
        },
        shouldSnap() {
            if (this.shouldSnap && this.startedDrawing && this.drawsOnImage) {
                this.startSnap();
            } else {
                this.endSnap();
            }
        }
    },
    created() {
        Keyboard.on('Control', () => {
            // Prevents changing shouldSnap before drawing event started
            if (this.startedDrawing) {
                this.shouldSnap = !this.shouldSnap
            }
        }, 0, this.listenerSet);
    }
}
</script>