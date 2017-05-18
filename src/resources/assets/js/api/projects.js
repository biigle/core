/**
 * Resource for Largo operations on projects.
 *
 * var resource = biigle.$require('largo.api.projects');
 *
 * Get all annotations with a specific label:
 * resource.queryAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed: {1: [...]}, changed: {12: 1, ...}}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('largo.api.projects', Vue.resource('api/v1/projects{/id}/largo', {}, {
    queryAnnotations: {
        method: 'GET',
        url: 'api/v1/projects{/id}/annotations/filter/label{/label_id}',
    }
}));
