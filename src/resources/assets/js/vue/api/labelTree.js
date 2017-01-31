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
 * Add an authorized project:
 * resource.addAuthorizedProject({id: labelTreeId}, {id: projectId}).then(...);
 *
 * Remove an authorized project:
 * resource.removeAuthorizedProject({id: labelTreeId, project_id: projectId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.labelTree', Vue.resource('/api/v1/label-trees{/id}', {}, {
    addAuthorizedProject: {
        method: 'POST',
        url: '/api/v1/label-trees{/id}/authorized-projects',
    },
    removeAuthorizedProject: {
        method: 'DELETE',
        url: '/api/v1/label-trees{/id}/authorized-projects{/project_id}',
    }
}));
