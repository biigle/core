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
 * @type {Vue.resource}
 */
biigle.$declare('api.projects', Vue.resource('/api/v1/projects{/id}', {}, {
    query: {
        // a user can only query their own projects
        url: '/api/v1/projects/my',
    },
    queryVolumes: {
        method: 'GET',
        url: '/api/v1/projects{/id}/volumes',
    },
    saveVolume: {
        method: 'POST',
        url: '/api/v1/projects{/id}/volumes',
    },
    attachVolume: {
        method: 'POST',
        url: '/api/v1/projects{/id}/volumes{/volume_id}',
    },
    detachVolume: {
        method: 'DELETE',
        url: '/api/v1/projects{/id}/volumes{/volume_id}',
    },
}));
