<script>
import { Feature } from '@biigle/ol';
import LineString from '@biigle/ol/geom/LineString';
import { Snap } from '@biigle/ol/interaction';
import Collection from '@biigle/ol/Collection';

export default {
    data() {
        return {
            snapInteraction: null,
            snapLineFeatures: new Collection(),
            snappingCoords: [0, 0],
            shouldSnap: false
        }
    },
    computed: {
        drawsOnImage() {
            return this.snappingCoords[0] >= 0 && this.snappingCoords[1] >= 0
                && this.snappingCoords[0] <= this.width && this.snappingCoords[1] <= this.height;
        },
        width() {
            return this.image.width;
        },
        height() {
            return this.image.height;
        }
    },
    methods: {
        updateSnapCoords(mapBrowserEvent) {
            // Coordinates need to be set here, because only this event contains the last set coordinate
            this.snappingCoords = mapBrowserEvent.coordinate;
            this.shouldSnap = mapBrowserEvent.originalEvent.ctrlKey;
            // Return always true to enable snapping when first point is set
            return true;
        },
        drawSnaplines() {
            let x = this.snappingCoords[0];
            let y = this.snappingCoords[1];

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
            this.drawSnaplines();
            this.snapInteraction = new Snap({features: this.snapLineFeatures, pixelTolerance: 15});
            this.map.addInteraction(this.snapInteraction);
            this.shouldSnap = false;
        },
        endSnap() {
            this.map.removeInteraction(this.snapInteraction);
            this.snapInteraction = undefined;
            this.snapLineFeatures.clear();
        },
    },
    watch: {
        drawEnded() {
            if (this.drawEnded && this.snapInteraction) {
                this.endSnap();
            }
        },
        shouldSnap() {
            if (this.shouldSnap && !this.isDrawingCircle && !this.isDrawingPoint) {
                if (this.snapInteraction) {
                    this.endSnap();
                }

                if (this.drawsOnImage) {
                    this.startSnap();
                } else {
                    this.shouldSnap = false;
                }
            }
        }
    },
    created() {
        // Enable deactivation of snapping tool during drawing process
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Control' && this.snapInteraction) {
                this.shouldSnap = false;
                this.endSnap();
            }
        });

        // Enable snapping tool during drawing process
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Control' && !this.drawEnded && !this.shouldSnap) {
                this.shouldSnap = true;
            }
        })
    }
}
</script>
