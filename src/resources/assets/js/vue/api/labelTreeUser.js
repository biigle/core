/**
 * Resource for label tree users.
 *
 * var resource = biigle.$require('api.labelTreeUser');
 *
 * Update the role of a user:
 * resource.update({label_tree_id: 1, id: 1}, {role_id: 1}).then(...);
 *
 * Attach a user to a label tree:
 * resource.save({label_tree_id: 1}, {id: 1, role_id: 2}).then(...);
 *
 * Detach a user from a label tree:
 * resource.delete({label_tree_id: 1, id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.labelTreeUser', Vue.resource('/api/v1/label-trees{/label_tree_id}/users{/id}'));
