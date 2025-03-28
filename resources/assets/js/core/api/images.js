import {Resource} from 'vue-resource';

/**
 * Resource for images.
 *
 * var resource = biigle.$require('api.images');
 *
 * Get an image:
 * resource.get({id: 1}).then(...);
 *
 * Get the file of an image:
 * resource.getFile({id: 1}).then(...);
 * CAUTION: You can run into CORS restrictions when you download an image as a blob like
 * this. Alternatively you can set the API URL directly as src of an HTMLImageElement to
 * load the image.
 *
 * Get all annotations of an image:
 * resource.getAnnotations({id: 1}).then(...);
 *
 * Add an annotation to an image:
 * resource.saveAnnotation({id: 1}, {
 *     shape_id: 1,
 *     label_id: 1,
 *     confidence: 1.0,
 *     points: [10, 20],
 *  }).then(...);
 *
 * Delete an image:
 * resource.delete({id: 1}).then(...);
 */
export default Resource('api/v1/images{/id}', {}, {
    getFile: {
        method: 'GET',
        url: 'api/v1/images{/id}/file',
    },
    getAnnotations: {
        method: 'GET',
        url: 'api/v1/images{/id}/annotations',
    },
    saveAnnotations: {
        method: 'POST',
        url: 'api/v1/images{/id}/annotations',
    },
});
