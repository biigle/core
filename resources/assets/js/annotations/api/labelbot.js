/**
 * Resource for fetching the LabelBOT ONNX model.
 *
 * var resource = biigle.$require('api.labelbot');
 *
 * Get the ONNX model:
 *
 * resource.fetch().then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/labelbot-onnx-model', {}, {
    fetch: {
        method: 'GET',
        url: 'api/v1/labelbot-onnx-model',
        responseType: 'blob',
    }
});
