<script>
import LabelbotIndicator from '../labelbotIndicator.vue';
import LabelbotPopup from '../labelbotPopup.vue';
import Styles from '../../stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import { LABELBOT_STATES } from '../../mixins/labelbot.vue';
import { clamp, trimCanvas } from '../../utils.js'

// DINOv2 image input size.
const INPUT_SIZE = 224;

export default {
    emits: [
        'change-labelbot-focused-popup',
        'close-labelbot-popup',
    ],
    props: {
        labelbotState: {
            type: String,
            default: null,
        },
        labelbotOverlays: {
            type: Array,
            default() {
                return [];
            },
        },
        focusedPopupKey: {
            type: Number,
            default: -1,
        },
        labelbotTimeout: {
            type: Number,
            default: 1,
        },
    },
    components: {
        labelbotPopup: LabelbotPopup,
        labelbotIndicator: LabelbotIndicator
    },
    data() {
        return {
            labelBotLayerAdded: false,
        };
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState === LABELBOT_STATES.INITIALIZING || this.labelbotState === LABELBOT_STATES.READY || this.labelbotState === LABELBOT_STATES.COMPUTING || this.labelbotState === LABELBOT_STATES.BUSY;
        },
    },
    methods: {
        updateLabelbotLabel(event) {
            this.$emit('swap', event.annotation, event.label);
        },
        closeLabelbotPopup(popup) {
            this.$emit('close-labelbot-popup', popup);
        },
        handleLabelbotPopupFocused(popup) {
            this.$emit('change-labelbot-focused-popup', popup);
        },
        handleDeleteLabelbotAnnotation(annotation) {
            this.$emit('delete', [annotation]);
        },
        getBoundingBox(imageWidth, imageHeight, points) {
            let minX = imageWidth;
            let minY = imageHeight;
            let maxX = 0;
            let maxY = 0;
            // Point
            if (points.length === 2) {
                // TODO: maybe use SAM or PTP module to convert point to shape
                const tempRadius = 64; // Same radius than used for Largo thumbnails.
                const [x, y] = points;
                minX = Math.max(0, x - tempRadius);
                minY = Math.max(0, y - tempRadius);
                maxX = Math.min(imageWidth, x + tempRadius);
                maxY = Math.min(imageHeight, y + tempRadius);
            } else if (points.length === 3) { // Circle
                const [centerX, centerY, radius] = points;
                minX = Math.max(0, centerX - radius);
                minY = Math.max(0, centerY - radius);
                maxX = Math.min(imageWidth, centerX + radius);
                maxY = Math.min(imageHeight, centerY + radius);
            } else {
                for (let i = 0; i < points.length; i += 2) {
                    const x = points[i];
                    const y = points[i + 1];
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
                // Ensure the bounding box is within the image dimensions
                minX = Math.max(0, minX);
                minY = Math.max(0, minY);
                maxX = Math.min(imageWidth, maxX);
                maxY = Math.min(imageHeight, maxY);
            }

            const width = maxX - minX;
            const height = maxY - minY;

            return [minX, minY, width, height];
        },
        calculateRectangleIntersection(r1, r2) {
            const [x1, y1, w1, h1] = r1;
            const [x2, y2, w2, h2] = r2;

            const left   = Math.max(x1, x2);
            const top    = Math.max(y1, y2);
            const right  = Math.min(x1 + w1, x2 + w2);
            const bottom = Math.min(y1 + h1, y2 + h2);

            return [left, top, Math.max(0, right - left), Math.max(0, bottom - top)];
        },
        getScaledImageSelection(image, x, y, width, height) {
            if (!this.tempCanvas) {
                this.tempCanvas = document.createElement('canvas');
                this.tempCanvas.width = INPUT_SIZE;
                this.tempCanvas.height = INPUT_SIZE;
                this.tempCanvasCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
            }

            // Find rectangular intersection of selection and image
            [x, y, width, height] = this.calculateRectangleIntersection(
                [x, y, width, height], 
                [0, 0, image.width, image.height]
            ); 

            if (width === 0 || height === 0) {
                throw new Error("Selection was outside of the image");
            }

            this.tempCanvasCtx.drawImage(image, x, y, width, height, 0, 0, INPUT_SIZE, INPUT_SIZE);
            
            /*this.tempCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }, "image/png");*/
            
            return this.tempCanvasCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
        },
        createLabelbotImageFromRegularImage(points) {
            const [x, y, width, height] = this.getBoundingBox(this.image.source.width, this.image.source.height, points);

            return this.getScaledImageSelection(this.image.source, x, y, width, height);
        },
        async createLabelbotImageFromLayer(points, { width, height, layer }) {
            // Coordinates in image coordinates
            let [x, y, w, h] = this.getBoundingBox(width, height, points);

            // Image coordinates of the top left and bottom right corner shown in the map
            let [topLeftX, topLeftY] = this.map.getCoordinateFromPixel([0, 0]);
            topLeftX = clamp(topLeftX, 0, width);
            topLeftY = height - clamp(topLeftY, 0, height);

            let bottomRightX = this.map.getCoordinateFromPixel(this.map.getSize())[0];
            bottomRightX = clamp(bottomRightX, 0, width);

            const visibleImagePartWidth = bottomRightX - topLeftX;

            return new Promise((resolve, reject) => {
                layer.once('postrender', event => {
                    const mapScreenshot = trimCanvas(event.context.canvas);
                    const scale = mapScreenshot.width / visibleImagePartWidth;

                    // Coordinates in screenshot coordinates
                    [x, y, w, h] = [(x - topLeftX) * scale, (y - topLeftY) * scale, w * scale, h * scale];
                    
                    try {
                        resolve(this.getScaledImageSelection(mapScreenshot, x, y, w, h));
                    } catch(err) {
                        reject(err);
                    }
                });

                this.map.render();
            });
        },
        async createLabelbotImage(points) {
            let screenshot = null;
            
            try {
                if (this.video) {
                    screenshot = await this.createLabelbotImageFromLayer(points, {
                        width: this.video.videoWidth,
                        height: this.video.videoHeight,
                        layer: this.videoLayer
                    });
                } else if (!this.image.tiled) {
                    screenshot = this.createLabelbotImageFromRegularImage(points);
                } else {
                    screenshot = await this.createLabelbotImageFromLayer(points, {
                        width: this.image.width,
                        height: this.image.height,
                        layer: this.tiledImageLayer
                    });
                }

                return {success: true, screenshot: screenshot};
            } catch(error) {
                return {success: false, error: error};
            }
        },
    },
    watch: {
        labelbotState() {
            // We should always reset interaction mode when LabelBOT's state is changed
            // to OFF/Disabled and no Label is selected to avoid empty annotation (blue
            // features).
            if (!this.labelbotIsActive && !this.selectedLabel) {
                this.resetInteractionMode();
            }
        },
        labelbotIsActive(active) {
            if (active && !this.labelBotLayerAdded) {
                this.map.addLayer(this.labelbotLayer);
                this.labelBotLayerAdded = true;
            }
        }
    },
    created() {
        // Layer for LabelBOT popup dashed line and editing annotation with opacity=1.
        // These variables should not be reactive.
        this.labelbotSource = new VectorSource();

        this.labelbotLayer = new VectorLayer({
            source: this.labelbotSource,
            zIndex: 101, // above annotationLayer
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            style: Styles.features,
            opacity: 1, // opacity not configurable
        });
    },
};
</script>
