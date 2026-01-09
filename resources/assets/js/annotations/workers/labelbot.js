import {InferenceSession, Tensor} from "onnxruntime-web/webgpu";

// DINOv2 image input size.
const INPUT_SIZE = 224;
const DINO_MEAN = [0.485, 0.456, 0.406];
const DINO_STD = [0.229, 0.224, 0.225];

let MODEL;

function initModel (url) {
    return fetch(url)
        .then(r => r.blob())
        .then(b => URL.createObjectURL(b))
        .then((u) => {
            return InferenceSession.create(u, {executionProviders: ['webgpu']})
                .catch(() => InferenceSession.create(u, {executionProviders: ['wasm']}))
                .then((m) => MODEL = m)
                .then(warmUpModel);
        });
}

function warmUpModel(model) {
    const size = INPUT_SIZE * INPUT_SIZE;
    const dummyAnnotationDataArray = new Float32Array(size * 3);
    const tensor = new Tensor('float32', dummyAnnotationDataArray, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    model.run({ input: tensor});
}

function getTensor(imageData) {
    const size = INPUT_SIZE * INPUT_SIZE;
    const annotationDataArray = new Float32Array(size * 3);

    for (let i = 0; i < size; i++) {
        annotationDataArray[i] = ((imageData[i * 4] / 255.0) - DINO_MEAN[0]) / DINO_STD[0];
        annotationDataArray[size + i] = ((imageData[i * 4 + 1] / 255.0) - DINO_MEAN[1]) / DINO_STD[1];
        annotationDataArray[2 * size + i] = ((imageData[i * 4 + 2] / 255.0) - DINO_MEAN[2]) / DINO_STD[2];
    }

    return new Tensor('float32', annotationDataArray, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

self.onmessage = function(event) {
    const type = event.data.type;

    if (type === 'init') {
        initModel(event.data.url).then(() => {
            self.postMessage({type: 'init'});
        }, (e) => {
            self.postMessage({type: 'init', error: e});
        });
    } else if (type === 'run' && MODEL) {
        MODEL.run({input: getTensor(event.data.image)})
            .then((output) => {
                self.postMessage({
                    type: 'run',
                    labelbotMessageID: event.data.labelbotMessageID,
                    vector: output[Object.keys(output)[0]].data,
                });
            }, (error) => {
                self.postMessage({
                    type: 'run',
                    labelbotMessageID: event.data.labelbotMessageID,
                    error: error,
                });
            });
    }
};
