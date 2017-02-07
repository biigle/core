/**
 * Resource for annotation patches.
 *
 * var resource = biigle.$require('largo.api.annotations');
 *
 * Get an annotation patch:
 * resource.get({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('largo.api.annotations', Vue.resource('api/v1/annotations{/id}/patch'));
