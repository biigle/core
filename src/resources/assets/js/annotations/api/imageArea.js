/**
 * Resource for the image area.
 *
 * var resource = biigle.$require('annotations.api.imageArea');
 *
 * Get the area of an image:
 * resource.get({id: 1).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('annotations.api.imageArea', Vue.resource('api/v1/images{/id}/area'));
