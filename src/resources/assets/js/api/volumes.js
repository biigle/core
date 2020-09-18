/**
 * Resource for Largo operations on volumes.
 *
 * var resource = biigle.$require('largo.api.volumes');
 *
 * Get all annotations with a specific label:
 * resource.queryAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed: {1: [...]}, changed: {12: 1, ...}}).then(...);
 *
 * Get example annotations for a specific label (other than queryAnnotations this may
 * return examples from other labels as well):
 * resource.queryExampleAnnotations({id: 1, label_id: 124}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/volumes{/id}/largo', {}, {
    queryAnnotations: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/image-annotations/filter/label{/label_id}',
    },
    queryExampleAnnotations: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/image-annotations/examples{/label_id}',
    },
});
