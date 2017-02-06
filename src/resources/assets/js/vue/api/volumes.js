/**
 * Resource for Largo operations on volumes.
 *
 * var resource = biigle.$require('largo.api.volumes');
 *
 * Get all annotations with a specific label:
 * resource.queryAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed: ..., changed: ...}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('largo.api.volumes', Vue.resource('/api/v1/volumes{/id}/largo', {}, {
    queryAnnotations: {
        method: 'GET',
        url: '/api/v1/volumes{/id}/annotations/filter/label{/label_id}',
    }
}));
