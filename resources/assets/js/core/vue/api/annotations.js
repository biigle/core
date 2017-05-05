/**
 * Resource for annotations.
 *
 * var resource = biigle.$require('api.annotations');
 *
 * Update an annotation:
 * resource.save({id: 1}, {points: [10, 10]}).then(...);
 *
 * Delete an annotation:
 * resource.delete({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.annotations', Vue.resource('api/v1/annotations{/id}'));
