/**
 * Resource for projects.
 *
 * var resource = biigle.$require('api.projects');
 *
 * Get all projects the current user belongs to:
 * resource.query().then(...);
 *
 * Get one project:
 * resource.get({id: 1}).then(...);
 *
 * Create a new project:
 * resource.save({}, {name: 'Test', description: 'Test project'}).then(...);
 *
 * Update a project:
 * resource.update({id: 1}, {name: 'My new name'}).then(...);
 *
 * Delete a project:
 * resource.delete({id: 1}).then(...);
 *
 * Get all volumes attached to a project:
 * resource.queryVolumes({id: 1}).then(...);
 *
 * Create a new volume for for a project:
 * resource.saveVolume({id: 1}, {
 *     name: "volume 1",
 *     url: "/vol/volumes/1",
 *     media_type_id: 1,
 *     images: ["1.jpg", "2.jpg"]
 * }).then(...);
 *
 * Attach an existing volume to a project:
 * resource.attachVolume({id: 1, volume_id: 12}, {}).then(...);
 *
 * Detach a volume from a project:
 * resource.detachVolume({id: 1, volume_id: 12}).then(...);
 *
 * Attach a user to a project:
 * resource.save({id: 1, user_id: 1}, {project_role_id: 2}).then(...);
 *
 * Update the role of a user:
 * resource.update({id: 1, user_id: 1}, {project_role_id: 1}).then(...);
 *
 * Detach a user from a project:
 * resource.delete({id: 1, user_id: 1}).then(...);
 *
 * Get all label trees available for a project:
 * resource.queryAvailableLabelTrees({id: 1}).then(...);
 *
 * Attach a label tree (with ID 31) to a project:
 * resource.attachLabelTree({id: 1}, {id: 31}).then(...);
 *
 * Detach a label tree from a project:
 * resource.detachLabelTree({id: 1, label_tree_id: 31}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/projects{/id}', {}, {
    queryVolumes: {
        method: 'GET',
        url: 'api/v1/projects{/id}/volumes',
    },
    saveVolume: {
        method: 'POST',
        url: 'api/v1/projects{/id}/volumes',
    },
    attachVolume: {
        method: 'POST',
        url: 'api/v1/projects{/id}/volumes{/volume_id}',
    },
    detachVolume: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/volumes{/volume_id}',
    },
    addUser: {
        method: 'POST',
        url: 'api/v1/projects{/id}/users{/user_id}',
    },
    updateUser: {
        method: 'PUT',
        url: 'api/v1/projects{/id}/users{/user_id}',
    },
    removeUser: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/users{/user_id}',
    },
    queryAvailableLabelTrees: {
        method: 'GET',
        url: 'api/v1/projects{/id}/label-trees/available{/name}',
    },
    attachLabelTree: {
        method: 'POST',
        url: 'api/v1/projects{/id}/label-trees',
    },
    detachLabelTree: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/label-trees{/label_tree_id}',
    },
});
