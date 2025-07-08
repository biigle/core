<script>
import AnnotationsStore from '../stores/annotations.js';
import Keyboard from '../../core/keyboard';
import LabelbotWorker from '../workers/labelbot.js?worker';
import LabelbotWorkerUrl from '../workers/labelbot.js?worker&url';

// DINOv2 image input size.
const INPUT_SIZE = 224;

export const LABELBOT_STATES = {
    INITIALIZING: 'initializing',
    COMPUTING: 'computing',
    READY: 'ready',
    BUSY: 'busy',
    NOLABELS: 'nolabels',
    CORSERROR: 'corserror',
    TILEDIMAGE: 'tiledimage',
    OFF: 'off'
};

export default {
    data() {
        return {
            labelbotModel: null,
            labelbotState: LABELBOT_STATES.OFF,
            labelbotOverlays: [],
            focusedPopupKey: -1,
            labelbotRequestsInFlight: 0,
            labelbotMaxRequests: 1,
            labelbotWorker: null,
            labelBotWorkerListeners: [],
        };
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState === LABELBOT_STATES.INITIALIZING || this.labelbotState === LABELBOT_STATES.READY || this.labelbotState === LABELBOT_STATES.COMPUTING || this.labelbotState === LABELBOT_STATES.BUSY;
        },
    },
    methods: {
        handleLabelbotWorkerMessage(e) {
            this.labelBotWorkerListeners
                .filter(l => l.matchFn(e))
                .map(l => this.labelBotWorkerListeners.splice(this.labelBotWorkerListeners.indexOf(l), 1))
                .flat()
                .forEach(l => l.resolve(e));
        },
        handleLabelbotWorkerError(e) {
            this.labelBotWorkerListeners
                .filter(l => l.matchFn(e))
                .map(l => this.labelBotWorkerListeners.splice(this.labelBotWorkerListeners.indexOf(l), 1))
                .flat()
                .forEach(l => l.reject(e));
        },
        addLabelbotWorkerListener(matchFn) {
            return new Promise((resolve, reject) => {
                this.labelBotWorkerListeners.push({
                    matchFn: matchFn,
                    resolve: resolve,
                    reject: reject,
                });
            });
        },
        getWorker() {
            if (import.meta.env.DEV) {
                // This is a workaround to support loading of a web worker via cross
                // origin during local development. This code does not correctly resolve
                // ORT binary URLs in production, though, so it is only enabled in dev.
                // See: https://github.com/vitejs/vite/issues/13680
                const url = new URL(LabelbotWorkerUrl, import.meta.url);
                const js = `import ${JSON.stringify(url)}`;
                const blob = new Blob([js], {type: "application/javascript"});
                const objURL = URL.createObjectURL(blob);
                const worker = new Worker(objURL, {type: "module"});
                worker.addEventListener("error", () => URL.revokeObjectURL(objURL));

                return worker;
            }

            return new LabelbotWorker();
        },
        async initLabelbotWorker() {
            this.labelbotWorker = this.getWorker();
            this.labelbotWorker.addEventListener('message', this.handleLabelbotWorkerMessage);
            this.labelbotWorker.addEventListener('error', this.handleLabelbotWorkerError);

            this.updateLabelbotState(LABELBOT_STATES.INITIALIZING);
            const modelUrl = biigle.$require('labelbot.onnxUrl');

            this.addLabelbotWorkerListener(e => e.data?.type === 'init')
                .then((e) => {
                    if (e.data?.error) {
                        throw e.data.error;
                    }
                    this.updateLabelbotState(LABELBOT_STATES.READY);
                })
                .catch((e) => {
                    this.updateLabelbotState(LABELBOT_STATES.OFF);
                    this.labelbotWorker.terminate();
                    this.labelbotWorker = null;

                    throw e;
                });

            this.labelbotWorker.postMessage({type: 'init', url: modelUrl});
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
            const box = this.getBoundingBox(points);
            const [x, y, width, height] = box;

            // Create a temporary canvas for processing the selected region
            if (!this.tempLabelbotCanvas) {
                this.tempLabelbotCanvas = document.createElement('canvas');
                this.tempLabelbotCanvas.width = INPUT_SIZE;
                this.tempLabelbotCanvas.height = INPUT_SIZE;
                this.tempLabelbotCanvasCtx = this.tempLabelbotCanvas.getContext('2d', {
                    willReadFrequently: true,
                });
            }
            const ctx = this.tempLabelbotCanvasCtx;

            ctx.clearRect(0, 0, INPUT_SIZE, INPUT_SIZE);
            ctx.drawImage(this.image.source, x, y, width, height, 0, 0, INPUT_SIZE, INPUT_SIZE);

            const annotationData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;

            const promise = this.addLabelbotWorkerListener(
                e => box.every((v, i) => v === e.data?.box[i])
            ).then(e => e.data.vector);

            this.labelbotWorker.postMessage({
                type: 'run',
                image: annotationData,
                // Send the box as a means to identify which received vector belongs to
                // which sent message.
                box: box,
            });

            return promise;
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
                this.focusedPopupKey = this.labelbotOverlays[this.labelbotOverlays.length - 1]?.id;

                if (!this.focusedPopupKey) {
                    Keyboard.setActiveSet('default');
                }
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

            if (this.labelbotState === LABELBOT_STATES.INITIALIZING) {
                return Promise.reject({body: {message: 'LabelBOT is not finished initializing.'}});
            }

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
        labelbotIsActive() {
            if (!this.labelbotWorker) {
                this.initLabelbotWorker();
            }
        },
        image(image) {
            if (image?.crossOrigin) {
                this.updateLabelbotState(LABELBOT_STATES.CORSERROR);
            } else if (image?.tiled) {
                this.updateLabelbotState(LABELBOT_STATES.TILEDIMAGE);
            } else if (this.labelbotState === LABELBOT_STATES.CORSERROR) {
                this.updateLabelbotState(LABELBOT_STATES.OFF);
            } else if (this.labelbotState === LABELBOT_STATES.TILEDIMAGE) {
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
