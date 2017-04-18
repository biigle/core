/**
 * Resource for images.
 *
 * var resource = biigle.$require('api.images');
 *
 * Get an image:
 * resource.get({id: 1}).then(...);
 *
 * Delete an image:
 * resource.delete({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.images', Vue.resource('api/v1/images{/id}'));
