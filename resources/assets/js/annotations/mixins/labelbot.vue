<script>
import {InferenceSession, Tensor} from "onnxruntime-web/webgpu";
import LabelbotApi from '../api/labelbot';
import {handleErrorResponse} from '../../core/messages/store';

export default {
    data() {
        return {
            model: null,
            labelbotIsOn: false,
            labelbotIsBusy: false, // true if max number of requests is reached.
            labelbotState: 'initializing',
            labelbotOverlays: [],
            // Cache api
            cacheName: 'labelbot-model-cache',
            modelCacheKey: '/cached-labelbot-model.onnx',
        };
    },
    methods: {
        initModel() {
            this.labelbotState = 'initializing';

            caches.open(this.cacheName).then((cache) => {
                cache.match(this.modelCacheKey).then((cachedResponse) => {
                    // Model is cached
                    if (cachedResponse) {
                        cachedResponse.blob().then((modelBlob) => {
                            const modelUrl = URL.createObjectURL(modelBlob);
                            this.loadModel(modelUrl);
                        });
                    } else {
                        LabelbotApi.fetch()
                        .then((response) => response.blob())
                        .then((blob) => {
                            // Cache the model before loading it
                            cache.put(this.modelCacheKey, new Response(blob));
                            const modelUrl = URL.createObjectURL(blob);
                            this.loadModel(modelUrl);
                        })
                    }
                });
            })
            .catch(handleErrorResponse);
        },
        loadModel(modelUrl) {
            // Load the onnx model with webgpu first 
            // if the client does not have one then fallback to wasm
            InferenceSession.create(modelUrl, { executionProviders: ['webgpu'] })
            .then((model) => {
                this.model = model;
                this.labelbotState = 'ready';
            })
            .catch(() => {
                InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
                .then((model) => {
                    this.model = model;
                    this.labelbotState = 'ready';
                })
                .catch(handleErrorResponse)
            })
        },
        generateFeatureVector(points) {
            // Get selected region
            const [x, y, width, height] = this.getBoundingBox(points);

            // Create a temporary canvas for processing the selected region
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 224;
            tempCanvas.height = 224;
            const tempContext = tempCanvas.getContext('2d');

            // Draw the selected region on the temporary canvas
            tempContext.drawImage(this.image.labelBOTCanvas, x, y, width, height, 0, 0, 224, 224);

            // Extract image data
            const annotationData = tempContext.getImageData(0, 0, 224, 224).data;
            const annotationDataArray = new Float32Array(224 * 224 * 3);
            for (let i = 0, j = 0; i < annotationData.length; i += 4, j++) {
                annotationDataArray[j] = annotationData[i] / 255.0;
                annotationDataArray[224 * 224 + j] = annotationData[i + 1] / 255.0;
                annotationDataArray[2 * 224 * 224 + j] = annotationData[i + 2] / 255.0;
            }

            // Convert the annotation data to tensor
            const tensor = new Tensor('float32', annotationDataArray, [1, 3, 224, 224]);

            // Generate feature vector
            return this.model.run({ input: tensor}).then((output) => {
                return output[Object.keys(output)[0]].data
            })
            .catch(handleErrorResponse);
        },
        updateLabelbotState(state) {
            this.labelbotState = state;
        },
        setLabelbotLabels(annotation) {
            for (const labelbotOverlay of this.labelbotOverlays) {
                if (labelbotOverlay.available) {
                    labelbotOverlay.available = false;
                    labelbotOverlay.labels = [annotation.labels[0].label].concat(annotation.labelBOTLabels);
                    labelbotOverlay.annotation = annotation;

                    // calculate position
                    const convertedPoints = labelbotOverlay.convertPointsToOl(annotation.points);
                    const position = [convertedPoints[0] - 40, convertedPoints[1]];
                    labelbotOverlay.overlay.setPosition(position);
                    break;
                }
            }
            this.labelbotIsBusy = this.labelbotOverlays.every(overlay => !overlay.available)

            return annotation;
        },
        updateLabelbotLabel(label) {
            this.handleSwapLabel(this.labelbotOverlays[label.popupKey].annotation, label.label)
        },
        deleteLabelbotLabels(popupKey) {
            this.labelbotOverlays[popupKey].available = true;
            this.labelbotOverlays[popupKey].labels = [];
            this.labelbotIsBusy = false;
        },
    },
    created() {
        this.initModel();

        const maxNRequests = biigle.$require('labelbot.m');
        this.labelbotOverlays = Array.from({ length: maxNRequests }, () => ({
            available: true,
            overlay: null,
            labels: [],
            annotation: null,
            convertPointsToOl: null,
        }));
    },
};
</script>
