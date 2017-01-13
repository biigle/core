/**
 * Resource for volumes attached to projects
 *
 * var resource = biigle.$require('api.projectVolumes');
 *
 * Get all volumes attached to a project:
 *
 * resource.query({pid: projectId}).then(...);
 *
 * Create a new volume for for a project:
 *
 * resource.save({pid: projectId}, {
 *     name: "volume 1",
 *     url: "/vol/volumes/1",
 *     media_type_id: 1,
 *     images: ["1.jpg", "2.jpg"]
 * }).then(...);
 *
 * Attach an existing volume to a project:
 *
 * resource.attach({pid: projectId, id: volumeId}, {}).then(...);
 *
 * Detach a volume from a project:
 *
 * resource.detach({pid: projectId, id: volumeId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.projectVolumes', Vue.resource('/api/v1/projects{/pid}/volumes{/id}', {}, {
    attach: {method: 'POST'},
    detach: {method: 'DELETE'}
}));
