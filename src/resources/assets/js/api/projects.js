/**
 * Resource for Largo operations on projects.
 *
 * var resource = biigle.$require('largo.api.projects');
 *
 * Get all annotations with a specific label:
 * resource.queryImageAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed: {1: [...]}, changed: {12: 1, ...}}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/projects{/id}/largo', {}, {
    queryImageAnnotations: {
        method: 'GET',
        url: 'api/v1/projects{/id}/image-annotations/filter/label{/label_id}',
    }
});
