/**
 * Resource for label trees.
 *
 * var resource = biigle.$require('api.labelTree');
 *
 * Get all public label trees:
 * resource.query().then(...);
 *
 * Create a new label tree:
 * resource.save({}, {name: "My Label Tree", visibility_id: 1, description: "tree"}).then(...);
 *
 * Update a label tree:
 * resource.update({id: 1}, {name: 'My new name'}).then(...);
 *
 * Delete a label tree:
 * resource.delete({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.labelTree', Vue.resource('/api/v1/label-trees{/id}'));
