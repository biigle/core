/**
 * Resource for requiring all annotation shapes.
 *
 * var resource = biigle.$require('largo.api.shapes');
 *
 * Get all available shapes:
 * resource.getAllShapes().then(...)
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/shapes', {}, {
    getAllShapes: {
        method: 'GET',
        url: 'api/v1/shapes',
    }
});
