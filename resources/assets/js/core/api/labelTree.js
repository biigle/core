import {Resource} from 'vue-resource';

/**
 * Resource for label trees.
 *
 * var resource = biigle.$require('api.labelTree');
 *
 * Get all label trees accessible by the current user:
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
 * Add an authorized project:
 * resource.addAuthorizedProject({id: labelTreeId}, {id: projectId}).then(...);
 *
 * Remove an authorized project:
 * resource.removeAuthorizedProject({id: labelTreeId, project_id: projectId}).then(...);
 *
 * Attach a user to a label tree:
 * resource.save({id: 1}, {id: 1, role_id: 2}).then(...);
 *
 * Update the role of a user:
 * resource.update({id: 1, user_id: 1}, {role_id: 1}).then(...);
 *
 * Detach a user from a label tree:
 * resource.delete({id: 1, user_id: 1}).then(...);
 */
export default Resource('api/v1/label-trees{/id}', {}, {
    addAuthorizedProject: {
        method: 'POST',
        url: 'api/v1/label-trees{/id}/authorized-projects',
    },
    removeAuthorizedProject: {
        method: 'DELETE',
        url: 'api/v1/label-trees{/id}/authorized-projects{/project_id}',
    },
    addUser: {
        method: 'POST',
        url: 'api/v1/label-trees{/id}/users',
    },
    updateUser: {
        method: 'PUT',
        url: 'api/v1/label-trees{/id}/users{/user_id}',
    },
    removeUser: {
        method: 'DELETE',
        url: 'api/v1/label-trees{/id}/users{/user_id}',
    },
});
