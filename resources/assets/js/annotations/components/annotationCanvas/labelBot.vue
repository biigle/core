<script>
import LabelbotIndicator from '../labelbotIndicator.vue';
import LabelbotPopup from '../labelbotPopup.vue';
import { LABELBOT_STATES } from '../../mixins/labelbot.vue';
import { makeBlob } from '../../makeBlobFromCanvas.js';
import { clamp, getBoundingBox } from '../../utils.js';

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
        async makeMapScreenshot() {
            const promise = new Promise(resolve => {
                this.tiledImageLayer.once('postrender', event => {
                    makeBlob(event.context.canvas).then(blob => {
                        resolve(createImageBitmap(blob));
                    });
                });
            });
            
            this.map.render();
            
            return promise;
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
        drawImageSelectionToTempCanvas(image, x, y, width, height) {
            if(!this.tempCanvas) 
            {
                this.tempCanvas = document.createElement('canvas');
                this.tempCanvasCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
            }
            
            // Find rectangular intersection of selection and image
            [x, y, width, height] = this.calculateRectangleIntersection(
                [x, y, width, height], 
                [0, 0, image.width, image.height]
            ); 
            
            if(width === 0 || height === 0)
                throw new Error("Selection was outside of the image");
            
            this.tempCanvas.width = width;
            this.tempCanvas.height = height;
            this.tempCanvasCtx.drawImage(image, x, y, width, height, 0, 0, width, height);
            
            return this.tempCanvas;
        },
        createSelectionCanvasFromRegularImage(points) {
            const [x, y, width, height] = getBoundingBox(this.image.source, points);
            
            return this.drawImageSelectionToTempCanvas(this.image.source, x, y, width, height);
        },
        async createSelectionCanvasFromTiledImage(points) {
            // Coordinates in image coordinates
            let [x, y, width, height] = getBoundingBox(this.image, points);
            
            // Image coordinates of the top left and bottom right corner shown in the map
            let [topLeftX, topLeftY] = this.map.getCoordinateFromPixel([0, 0]);
            topLeftX = clamp(topLeftX, 0, this.image.width);
            topLeftY = this.image.height - clamp(topLeftY, 0, this.image.height);
            
            let bottomRightX = this.map.getCoordinateFromPixel(this.map.getSize())[0];
            bottomRightX = clamp(bottomRightX, 0, this.image.width);
            
            const mapScreenshot = await this.makeMapScreenshot();
            const visibleImagePartWidth = bottomRightX - topLeftX;
            
            const scale = mapScreenshot.width / visibleImagePartWidth;
            
            // Coordinates in screenshot coordinates
            [x, y, width, height] = [(x - topLeftX) * scale, (y - topLeftY) * scale, width * scale, height * scale];
            
            return this.drawImageSelectionToTempCanvas(mapScreenshot, x, y, width, height);
        },
        async createSelectionCanvas(points) {
            if(!this.image)
                throw new Error("No image available");
            
            if(!this.image.tiled)
                return this.createSelectionCanvasFromRegularImage(points);
            else 
                return await this.createSelectionCanvasFromTiledImage(points);
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
    },
};
</script>
