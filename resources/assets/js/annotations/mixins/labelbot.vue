<script>
import AnnotationsStore from '../stores/annotations.js';
import Keyboard from '../../core/keyboard';
import {handleErrorResponse} from '../../core/messages/store';
import {InferenceSession, Tensor} from "onnxruntime-web/webgpu";

export const LABELBOT_STATES = {
    INITIALIZING: 'initializing',
    COMPUTING: 'computing',
    READY: 'ready',
    BUSY: 'busy',
    NOLABELS: 'nolabels',
    CORSERROR: 'corserror',
    OFF: 'off'
};

export default {
    data() {
        return {
            labelbotModel: null,
            labelbotModelInputSize: 224, // DINOv2 image input size
            labelbotState: LABELBOT_STATES.OFF,
            labelbotOverlays: [],
            focusedPopupKey: -1,
            // Cache api
            labelbotCacheName: 'labelbot',
            labelbotModelCacheKey: '/cached-labelbot-onnx-model',
            labelbotRequestsInFlight: 0,
            labelbotMaxRequests: 1,
        };
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState !== LABELBOT_STATES.OFF && this.labelbotState !== LABELBOT_STATES.NOLABELS && this.labelbotState !== LABELBOT_STATES.CORSERROR;
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
                const tempRadius = 64; // Same radius than used for Largo thumbnails.
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
            });
        },
        showLabelbotPopup(annotation) {
            this.labelbotOverlays.push(annotation);
            this.focusedPopupKey = annotation.id;
            Keyboard.setActiveSet('labelbot');
        },
        updateLabelbotState(labelbotState) {
            this.labelbotState = labelbotState;
        },
        closeLabelbotPopup(annotation) {
            const index = this.labelbotOverlays.indexOf(annotation);
            if (index !== -1) {
                this.labelbotOverlays.splice(index, 1);
            }

            this.focusedPopupKey = this.labelbotOverlays[this.labelbotOverlays.length - 1]?.id;

            if (!this.focusedPopupKey) {
                Keyboard.setActiveSet('default');
            }
        },
        closeAllLabelbotPopups() {
            this.labelbotOverlays = [];
            this.focusedPopupKey = -1;
            Keyboard.setActiveSet('default');
        },
        changeLabelbotFocusedPopup(annotation) {
            this.focusedPopupKey = annotation.id;
        },
        storeLabelbotAnnotation(annotation) {
            const currentImageId = this.imageId;

            if (this.labelbotRequestsInFlight >= this.labelbotMaxRequests) {
                return Promise.reject({body: {message: `You already have ${this.labelbotMaxRequests} pending LabelBOT requests. Please wait for one to complete before submitting a new one.`}});
            }

            this.updateLabelbotState(LABELBOT_STATES.COMPUTING);

            return this.generateFeatureVector(annotation.points)
                .then(featureVector =>  annotation.feature_vector = featureVector)
                .then(() => this.labelbotRequestsInFlight += 1)
                .then(() => AnnotationsStore.create(currentImageId, annotation))
                .then((annotation) => {
                    if (currentImageId === this.imageId) {
                        this.showLabelbotPopup(annotation);
                    }

                    if (this.labelbotRequestsInFlight === 1) {
                        this.updateLabelbotState(LABELBOT_STATES.READY);
                    }

                    return annotation;
                })
                .catch((e) => {
                    if (e.status === 429) {
                        this.updateLabelbotState(LABELBOT_STATES.BUSY);
                    } else {
                        this.updateLabelbotState(LABELBOT_STATES.OFF);
                    }
                    throw e;
                })
                .finally((annotation) => {
                    this.labelbotRequestsInFlight -= 1;

                    return annotation;
                });
        },
    },
    watch: {
        labelbotState() {
            if (this.labelbotIsActive && !this.labelbotModel) {
                this.initLabelbotModel();
            }
        },
        image(image) {
            if (image?.crossOrigin) {
                this.updateLabelbotState(LABELBOT_STATES.CORSERROR);
            } else {
                this.updateLabelbotState(LABELBOT_STATES.OFF);
            }
        },
        imageIndex() {
            if (this.labelbotOverlays.length > 0) {
                this.closeAllLabelbotPopups();
            }
        },
    },
    created() {
        const emptyLabelTrees = biigle.$require('annotations.labelTrees').every(tree => tree.labels.length === 0);
        if (emptyLabelTrees) {
            this.updateLabelbotState(LABELBOT_STATES.NOLABELS);
        }

        this.labelbotMaxRequests = biigle.$require('labelbot.max_requests');
    },
};
</script>
