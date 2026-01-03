<script>
import AnnotationsStore from '../stores/annotations.js';
import Keyboard from '@/core/keyboard.js';
import LabelbotWorker from '../workers/labelbot.js?worker';
import LabelbotWorkerUrl from '../workers/labelbot.js?worker&url';
import Messages from '@/core/messages/store.js';

// This used to be higher to allow multiple popups at the same time but we found that
// only a single popup at a time supports a more efficient workflow.
const MAX_OVERLAY_COUNT = 1;

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
            labelbotState: LABELBOT_STATES.OFF,
            labelbotOverlays: [],
            focusedPopupKey: -1,
            labelbotRequestsInFlight: 0,
            labelbotMaxRequests: 1,
            labelbotMessageID: 0,
            labelbotWorker: null,
            labelBotWorkerListeners: [],
            labelbotTimeout: 1,
        };
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState === LABELBOT_STATES.INITIALIZING || this.labelbotState === LABELBOT_STATES.READY || this.labelbotState === LABELBOT_STATES.COMPUTING || this.labelbotState === LABELBOT_STATES.BUSY;
        },
        labelbotOverlayCount() {
            return this.labelbotOverlays.length;
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
                    Messages.danger('LabelBOT could not be initialized.');
                    this.updateLabelbotState(LABELBOT_STATES.OFF);
                    this.labelbotWorker.terminate();
                    this.labelbotWorker = null;

                    throw e;
                });

            this.labelbotWorker.postMessage({type: 'init', url: modelUrl});
        },
        generateFeatureVector(labelbotImage) {
            const labelbotMessageID = this.labelbotMessageID++;
            const promise = this.addLabelbotWorkerListener(
                e => labelbotMessageID === e.data?.labelbotMessageID
            ).then(e => e.data.vector);

            this.labelbotWorker.postMessage({
                type: 'run',
                image: labelbotImage,
                labelbotMessageID: labelbotMessageID
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

            return this.generateFeatureVector(annotation.labelbotImage)
                .then(featureVector => annotation.feature_vector = featureVector)
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
                    } else if (this.labelbotRequestsInFlight === 1) {
                        this.updateLabelbotState(LABELBOT_STATES.READY);
                    }
                    
                    throw e;
                })
                .finally((annotation) => {
                    if(this.labelbotRequestsInFlight > 0) {
                        this.labelbotRequestsInFlight -= 1;
                    }
                    
                    return annotation;
                });
        },
    },
    watch: {
        labelbotIsActive(active) {
            if (active && !this.labelbotWorker) {
                this.initLabelbotWorker();
            }
        },
        image(image) {
            if (image?.crossOrigin) {
                this.updateLabelbotState(LABELBOT_STATES.CORSERROR);
            } else if (this.labelbotState === LABELBOT_STATES.CORSERROR) {
                this.updateLabelbotState(LABELBOT_STATES.OFF);
            }
        },
        imageIndex() {
            if (this.labelbotOverlays.length > 0) {
                this.closeAllLabelbotPopups();
            }
        },
        labelbotOverlayCount(count) {
            if (count > MAX_OVERLAY_COUNT) {
                this.closeLabelbotPopup(this.labelbotOverlays[0]);
            }
        },
    },
    created() {
        const labelTrees = biigle.$require('annotations.labelTrees');
        // Label trees may not be set if the user can't annotate.
        if (!Array.isArray(labelTrees) || !labelTrees.some(t => t.labels.length > 0)) {
            this.updateLabelbotState(LABELBOT_STATES.NOLABELS);
        }

        this.labelbotMaxRequests = biigle.$require('labelbot.max_requests');
    },
};
</script>
