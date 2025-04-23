<script>
import {handleErrorResponse} from '../../core/messages/store';
import {InferenceSession, Tensor} from "onnxruntime-web/webgpu";
import LabelbotApi from '../api/labelbot';

/**
 * A Mixin for LabelBOT
 */
export default {
    data() {
        return {
            labelbotModel: null,
            labelbotModelInputSize: 224, // DINOv2 image input size
            labelbotIsOn: false,
            labelbotState: 'initializing',
            labelbotOverlays: [],
            labelbotLineFeatureLength: 75, // in px
            // Cache api
            labelbotCacheName: 'labelbot',
            modelCacheKey: '/cached-labelbot-onnx-model',
        };
    },
    methods: {
        initLabelbotModel() {
            this.labelbotState = 'initializing';

            caches.open(this.labelbotCacheName).then((cache) => {
                cache.match(this.labelbotModelCacheKey).then((cachedResponse) => {
                    // Model is cached
                    if (cachedResponse) {
                        cachedResponse.blob().then((modelBlob) => {
                            const modelUrl = URL.createObjectURL(modelBlob);
                            this.loadLabelbotModel(modelUrl);
                        });
                    } else {
                        LabelbotApi.fetch()
                        .then((response) => response.blob())
                        .then((blob) => {
                            // Cache the model before loading it
                            cache.put(this.labelbotModelCacheKey, new Response(blob));
                            const modelUrl = URL.createObjectURL(blob);
                            this.loadLabelbotModel(modelUrl);
                        })
                    }
                });
            })
            .catch(handleErrorResponse);
        },
        loadLabelbotModel(modelUrl) {
            // Load the onnx model with webgpu first 
            InferenceSession.create(modelUrl, { executionProviders: ['webgpu'] })
            .then((model) => {
                this.labelbotModel = model;
                this.labelbotState = 'ready';
            })
            // If the client does not have one then fallback to wasm
            .catch(() => {
                InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
                .then((model) => {
                    this.labelbotModel = model;
                    this.labelbotState = 'ready';
                })
                .catch(handleErrorResponse)
            })
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
            this.tempLabelbotCanvas.getContext('2d').drawImage(this.image.labelbotCanvas, x, y, width, height, 0, 0, this.labelbotModelInputSize, this.labelbotModelInputSize);

            // Extract image data
            const size = this.labelbotModelInputSize * this.labelbotModelInputSize;
            const annotationData = this.tempLabelbotCanvas.getContext('2d').getImageData(0, 0, this.labelbotModelInputSize, this.labelbotModelInputSize).data;
            const annotationDataArray = new Float32Array(size * 3);
            for (let i = 0, offset = 0; i < size; i++, offset += 4) {
                annotationDataArray[i] = annotationData[offset] / 255.0;
                annotationDataArray[size + i] = annotationData[offset + 1] / 255.0;
                annotationDataArray[2 * size + i] = annotationData[offset + 2] / 255.0;
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
                // TODO: Fix start point for Line shape
                let lineAnnotation = pointPairs[0] !== pointPairs.at(-1) && annotationPoints.length !== 8; // not rectangle

                // Sort by X descending
                pointPairs.sort((a, b) => b[0] - a[0]);
                const [p1, p2] = pointPairs.length >= 2 ? pointPairs.slice(0, 2) : [pointPairs[0], pointPairs[0]];

                if (lineAnnotation) {
                    startPoint = p1;
                } else {
                    // Midpoint for path start
                    startPoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
                }

                // Farthest-right point
                extraXOffset = p1[0]; 
            }

            // Positions
            const overlayPosition = [startPoint[0] + this.labelbotLineFeatureLength, startPoint[1]];
            const annotationOffset = [extraXOffset + 2 * offset, startPoint[1] + offset];
            const overlayOffset = [overlayPosition[0], overlayPosition[1] + offset];

            const path = [startPoint, annotationOffset, overlayOffset, overlayPosition];

            return { overlayPosition, path };
        },
        showLabelbotPopup(annotation) {
            for (const labelbotOverlay of this.labelbotOverlays) {
                if (labelbotOverlay.available) {
                    labelbotOverlay.available = false;
                    labelbotOverlay.labels = [annotation.labels[0].label].concat(annotation.labelBOTLabels);
                    labelbotOverlay.annotation = annotation;

                    // Convert annotation points and calculate start/end points
                    const convertedPoints = labelbotOverlay.convertPointsToOl(annotation.points);
                    const { overlayPosition, path } = this.calculateOverlayPosition(convertedPoints);

                    // Draw line feature and set overlay position
                    labelbotOverlay.popupLineFeature = labelbotOverlay.drawPopupLineFeature(path, annotation.labels[0].label.color);
                    labelbotOverlay.overlay.setPosition(overlayPosition);
                    break;
                }
            }
            // Update State
            this.labelbotState = this.labelbotOverlays.every(overlay => !overlay.available) ? 'busy' : 'ready';
        },
        updateLabelbotLabel(label) {
            this.handleSwapLabel(this.labelbotOverlays[label.popupKey].annotation, label.label)
        },
        deleteLabelbotLabels(popupKey) {
            this.labelbotOverlays[popupKey].removePopupLineFeature(this.labelbotOverlays[popupKey].popupLineFeature);
            this.labelbotOverlays[popupKey].available = true;
            this.labelbotOverlays[popupKey].labels = [];
            this.labelbotState = 'ready';
        },
    },
    watch: {
        labelbotIsOn() {
            if (this.labelbotIsOn && !this.labelbotModel) {
                this.initLabelbotModel();
            }
        }
    },
    created() {
        const maxNRequests = biigle.$require('labelbot.m');
        this.labelbotOverlays = Array.from({ length: maxNRequests }, () => ({
            available: true,
            overlay: null,
            labels: [],
            annotation: null,
            popupLineFeature: null,
            // functions
            convertPointsToOl: null,
            drawPopupLineFeature: null,
            removePopupLineFeature: null,
        }));
    },
};
</script>
