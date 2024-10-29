/**
 * Resource for Largo operations on labels.
 *
 * var resource = biigle.$require('largo.api.labels');
 *
 * Get first 4 image annotations with a specific label (that the user is allowed to see):
 * resource.queryImageAnnotations({id: 1, take: 4}).then(...);
 *
 * Get first 4 video annotations with a specific label (that the user is allowed to see):
 * resource.queryVideoAnnotations({id: 1, take: 4}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/labels{/id}', {}, {
    queryImageAnnotations: {
        method: 'GET',
        url: 'api/v1/labels{/id}/image-annotations',
    },
    queryVideoAnnotations: {
        method: 'GET',
        url: 'api/v1/labels{/id}/video-annotations',
    },
    fetchAllImageAnnotations: {
        method: 'GET',
        url: 'api/v1/volume{/id}/image-annotations',
    },
    fetchAllVideoAnnotations: {
        method: 'GET',
        url: 'api/v1/volume{/id}/video-annotations',
    }
});
