/**
 * Resource for Largo operations on labels.
 *
 * var resource = biigle.$require('largo.api.labels');
 *
 * Get first 4 annotations with a specific label (that the user is allowed to see):
 * resource.queryImageAnnotations({id: 1, take: 4}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/labels{/id}/image-annotations', {}, {
    queryImageAnnotations: {
        method: 'GET',
    },
});
