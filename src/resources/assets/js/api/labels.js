/**
 * Resource for Largo operations on labels.
 *
 * var resource = biigle.$require('largo.api.labels');
 *
 * Get first 4 annotations with a specific label (that the user is allowed to see):
 * resource.queryAnnotations({id: 1, take: 4}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('largo.api.labels', Vue.resource('api/v1/labels{/id}/annotations', {}, {
    queryAnnotations: {
        method: 'GET',
    },
}));
