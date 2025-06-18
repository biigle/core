<script>
import {handleErrorResponse} from '../../core/messages/store';
import {InferenceSession, Tensor} from "onnxruntime-web/webgpu";
import Keyboard from '../../core/keyboard';

export const LABELBOT_STATES = {
    INITIALIZING: 'initializing',
    COMPUTING: 'computing',
    READY: 'ready',
    BUSY: 'busy',
    DISABLED: 'disabled',
    OFF: 'off'
};

export const LABELBOT_TOGGLE_TITLE =  {
    NOLABELS: 'There must be at least one label in one of the label trees!',
    CORSERROR: 'Image loaded without proper CORS configuration!',
    NOANNOTATIONS: 'There are no annotations associated with any labels in this project!',
    ACTIVATE: 'Activate LabelBOT',
    DEACTIVATE: 'Deactivate LabelBOT'
};

/**
 * A Mixin for LabelBOT
 */

export default {
    data() {
        return {
            labelbotModel: null,
            labelbotModelInputSize: 224, // DINOv2 image input size
            labelbotState: LABELBOT_STATES.OFF,
            labelbotToggleTitle: LABELBOT_TOGGLE_TITLE.ACTIVATE,
            labelbotOverlays: [],
            labelbotLineFeatureLength: 100, // in px
            focusedPopupKey: -1,
            labelbotOverlaysTimeline: [],
            // Cache api
            labelbotCacheName: 'labelbot',
            labelbotModelCacheKey: '/cached-labelbot-onnx-model',
        };
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState !== LABELBOT_STATES.OFF && this.labelbotState !== LABELBOT_STATES.DISABLED;
        },
    },
    methods: {
        async initLabelbotModel() {
            this.updateLabelbotState(LABELBOT_STATES.INITIALIZING);
            const modelUrl = biigle.$require('labelbot.onnxUrl');

            try {
                const cache = await caches.open(this.labelbotCacheName);
                const cachedResponse = await cache.match(this.labelbotModelCacheKey);

                const modelBlob = cachedResponse
                    ? await cachedResponse.blob()
                    : await (async () => {
                        const networkResponse = await fetch(modelUrl);
                        // Cache the model before loading it
                        cache.put(this.labelbotModelCacheKey, networkResponse.clone());
                        return await networkResponse.blob();
                    })();

                const blobUrl = URL.createObjectURL(modelBlob);
                this.loadLabelbotModel(blobUrl);
            } catch (error) {
                this.updateLabelbotState(LABELBOT_STATES.OFF);
                handleErrorResponse(error);
            }
        },
        warmUpLabelbotModel() {
            if (this.labelbotModel) {
                // Warm up
                const size = this.labelbotModelInputSize * this.labelbotModelInputSize;
                const dummyAnnotationDataArray = new Float32Array(size * 3);
                const tensor = new Tensor('float32', dummyAnnotationDataArray, [1, 3, this.labelbotModelInputSize, this.labelbotModelInputSize]);
                this.labelbotModel.run({ input: tensor})
            }
        },
        loadLabelbotModel(modelUrl) {
            // Load the onnx model with webgpu first 
            InferenceSession.create(modelUrl, { executionProviders: ['webgpu'] })
                // If the client does not have one then fallback to wasm
                .catch(() => InferenceSession.create(modelUrl, { executionProviders: ['wasm'] }))
                .then((model) => this.labelbotModel = model)
                .then(this.warmUpLabelbotModel)
                .then(() => this.updateLabelbotState(LABELBOT_STATES.READY))
                .catch((error) => {
                    this.updateLabelbotState(LABELBOT_STATES.OFF);
                    handleErrorResponse(error);
                });
        },
        getBoundingBox(points) {
            let minX = this.image.width;
            let minY = this.image.height;
            let maxX = 0;
            let maxY = 0;
            // Point
            if (points.length === 2) {
                // TODO: maybe use SAM or PTP module to convert point to shape
                const tempRadius = 60;
                const [x, y] = points;
                minX = Math.max(0, x - tempRadius);
                minY = Math.max(0, y - tempRadius);
                maxX = Math.min(this.image.width, x + tempRadius);
                maxY = Math.min(this.image.height, y + tempRadius);
            } else if (points.length === 3) { // Circle
                const [centerX, centerY, radius] = points;
                minX = Math.max(0, centerX - radius);
                minY = Math.max(0, centerY - radius);
                maxX = Math.min(this.image.width, centerX + radius);
                maxY = Math.min(this.image.height, centerY + radius);
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
                maxX = Math.min(this.image.width, maxX);
                maxY = Math.min(this.image.height, maxY);
            }

            const width = maxX - minX;
            const height = maxY - minY;
            return [minX, minY, width, height];
        },
        generateFeatureVector(points) {
            // Get selected region
            const [x, y, width, height] = this.getBoundingBox(points);

            // Create a temporary canvas for processing the selected region
            if (!this.tempLabelbotCanvas) {
                this.tempLabelbotCanvas = document.createElement('canvas');
                this.tempLabelbotCanvas.width = this.labelbotModelInputSize;
                this.tempLabelbotCanvas.height = this.labelbotModelInputSize;
            }
            // Clear and draw new region
            this.tempLabelbotCanvas.getContext('2d').clearRect(0, 0, this.labelbotModelInputSize, this.labelbotModelInputSize);
            this.tempLabelbotCanvas.getContext('2d').drawImage(this.image.source, x, y, width, height, 0, 0, this.labelbotModelInputSize, this.labelbotModelInputSize);

            // Extract image data
            const size = this.labelbotModelInputSize * this.labelbotModelInputSize;
            const annotationData = this.tempLabelbotCanvas.getContext('2d').getImageData(0, 0, this.labelbotModelInputSize, this.labelbotModelInputSize).data;
            const annotationDataArray = new Float32Array(size * 3);

            // Image normalization
            const mean = [0.485, 0.456, 0.406];
            const std = [0.229, 0.224, 0.225];

            for (let i = 0; i < size; i++) {
                annotationDataArray[i] = ((annotationData[i * 4] / 255.0) - mean[0]) / std[0]; // R
                annotationDataArray[size + i] = ((annotationData[i * 4 + 1] / 255.0) - mean[1]) / std[1];  // G
                annotationDataArray[2 * size + i] = ((annotationData[i * 4 + 2] / 255.0) - mean[2]) / std[2];  // B
            }

            // Convert the annotation data to tensor
            const tensor = new Tensor('float32', annotationDataArray, [1, 3, this.labelbotModelInputSize, this.labelbotModelInputSize]);

            // Generate feature vector
            return this.labelbotModel.run({ input: tensor}).then((output) => {
                return output[Object.keys(output)[0]].data
            })
            .catch(handleErrorResponse);
        },
        calculateOverlayPosition(annotationPoints) {
            const offset = this.labelbotLineFeatureLength / 10;

            let startPoint;
            // Needed for polygon shapes
            let extraXOffset = annotationPoints[0];

            if (annotationPoints.length === 2) {
                // Point
                startPoint = annotationPoints;
            } else if (annotationPoints.length === 3) {
                // Circle
                const [x, y, r] = annotationPoints;
                startPoint = [x + r, y];
                extraXOffset = x + r;
            } else {
                // Polygon: convert flat array to [x, y] pairs
                const pointPairs = [];
                for (let i = 0; i < annotationPoints.length; i += 2) {
                    pointPairs.push([annotationPoints[i], annotationPoints[i + 1]]);
                }

                // Sort by X descending
                pointPairs.sort((a, b) => b[0] - a[0]);

                startPoint = pointPairs[0];

                // Farthest-right point
                extraXOffset = startPoint[0]; 
            }

            // Positions
            const overlayPosition = [startPoint[0] + this.labelbotLineFeatureLength, startPoint[1]];
            const annotationOffset = [extraXOffset + 2 * offset, startPoint[1] + offset];
            const overlayOffset = [overlayPosition[0], overlayPosition[1] + offset];

            const path = [startPoint, annotationOffset, overlayOffset, overlayPosition];

            return { overlayPosition, path };
        },
        getAvailableLabelbotOverlay() {
            for (let popupKey = 0; popupKey < this.labelbotOverlays.length; popupKey++) {
                if (this.labelbotOverlays[popupKey].available) {
                    this.labelbotOverlays[popupKey].available = false;
                    return popupKey;
                }
            }

            this.updateLabelbotState(LABELBOT_STATES.BUSY);

            return -1;
        },
        showLabelbotPopup(annotation, popupKey) {
            if (this.labelbotOverlays[popupKey]) {
                this.labelbotOverlays[popupKey].labels = [annotation.labels[0].label].concat(annotation.labelBOTLabels);
                this.labelbotOverlays[popupKey].annotation = annotation;

                // Convert annotation points and calculate start/end points
                const convertedPoints = this.labelbotOverlays[popupKey].convertPointsToOl(annotation.points);
                const { overlayPosition, path } = this.calculateOverlayPosition(convertedPoints);

                // Draw line feature and set overlay position
                this.labelbotOverlays[popupKey].popupLineFeature = this.labelbotOverlays[popupKey].drawPopupLineFeature(path, annotation.labels[0].label.color);
                this.labelbotOverlays[popupKey].overlay.setPosition(overlayPosition);

                // Set the popup as focused
                this.focusedPopupKey = popupKey;

                this.labelbotOverlaysTimeline.push(popupKey)

                this.labelbotOverlays[popupKey].ready = true;

                Keyboard.setActiveSet('labelbot');
            }

            if (this.labelbotIsActive) {
                this.updateLabelbotState(LABELBOT_STATES.READY);
            }
        },
        updateLabelbotLabel(label) {
            this.handleSwapLabel(this.labelbotOverlays[label.popupKey].annotation, label.label)
        },
        updateLabelbotState(labelbotState, toggleTitle='') {            
            this.labelbotState = this.labelbotOverlays?.every(overlay => !overlay.available) && labelbotState === LABELBOT_STATES.READY 
                ? LABELBOT_STATES.BUSY
                : labelbotState;

            switch (this.labelbotState) {
                case LABELBOT_STATES.OFF:
                    this.labelbotToggleTitle = LABELBOT_TOGGLE_TITLE.ACTIVATE;
                    break;
                case LABELBOT_STATES.DISABLED:
                    this.labelbotToggleTitle = toggleTitle || '';
                    break;
                default:
                    this.labelbotToggleTitle = LABELBOT_TOGGLE_TITLE.DEACTIVATE;
                    break;
            }
        },
        deleteLabelbotLabels(popupKey) {
            if (!this.labelbotOverlays[popupKey].overlay || !this.labelbotOverlays[popupKey].annotation) return

            this.labelbotOverlays[popupKey].removePopupLineFeature(this.labelbotOverlays[popupKey].popupLineFeature);
            this.labelbotOverlays[popupKey].available = true;
            this.labelbotOverlays[popupKey].ready = false;
            this.labelbotOverlays[popupKey].labels = [];
            this.labelbotOverlays[popupKey].annotation = null;

            // Update State if LabelBOT is active
            if (this.labelbotIsActive) {
                this.updateLabelbotState(LABELBOT_STATES.READY);
            }

            // Set focused pop key to the next most recent
            this.labelbotOverlaysTimeline.splice(this.labelbotOverlaysTimeline.indexOf(popupKey), 1);
            if (this.labelbotOverlaysTimeline.length > 0) {
                this.focusedPopupKey = this.labelbotOverlaysTimeline[this.labelbotOverlaysTimeline.length - 1];
            } else {
                this.focusedPopupKey = -1;
                // If no other popups are open then we reactivate the default listener set.
                Keyboard.setActiveSet('default');
            }
        },
        changeLabelbotFocusedPopup(popupKey) {
            this.focusedPopupKey = popupKey;
        },
        deleteLabelbotLabelsAnnotation(popupKey) {
            if (this.labelbotOverlays[popupKey].annotation) {
                this.handleDeleteAnnotation(this.labelbotOverlays[popupKey].annotation);
                this.deleteLabelbotLabels(popupKey);
            }
        }
    },
    watch: {
        labelbotState() {
            if (this.labelbotIsActive && !this.labelbotModel) {
                this.initLabelbotModel();
            }
        }
    },
    created() {
        const maxNRequests = biigle.$require('labelbot.max_requests');
        this.labelbotOverlays = Array.from({ length: maxNRequests }, () => ({
            available: true,
            ready: false, // true when labels is not empty
            overlay: null,
            labels: [],
            annotation: null,
            popupLineFeature: null,
            // functions
            convertPointsToOl: null,
            drawPopupLineFeature: null,
            removePopupLineFeature: null,
        }));

        // Disable LabelBOT if there are no labels in any label tree or no annotations in the project        
        const emptyLabelTrees = biigle.$require('annotations.labelTrees').every(tree => tree.labels.length === 0);
        const annotationsExist = biigle.$require('annotations.annotationsExist');
        if (emptyLabelTrees) {
            this.updateLabelbotState(LABELBOT_STATES.DISABLED, LABELBOT_TOGGLE_TITLE.NOLABELS);
        } else if (!annotationsExist) {
            this.updateLabelbotState(LABELBOT_STATES.DISABLED, LABELBOT_TOGGLE_TITLE.NOANNOTATIONS);
        }
    },
};
</script>
