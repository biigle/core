/**
 * Resource for transects attached to projects
 *
 * Get all transects attached to a project:
 *
 * biigle.projectTransects.query({pid: projectId}).then(...);
 *
 * Create a new transect for for a project:
 *
 * biigle.projectTransects.save({pid: projectId}, {
 *     name: "transect 1",
 *     url: "/vol/transects/1",
 *     media_type_id: 1,
 *     images: ["1.jpg", "2.jpg"]
 * }).then(...);
 *
 * Attach an existing transect to a project:
 *
 * biigle.projectTransects.attach({pid: projectId, id: transectId}, {}).then(...);
 *
 * Detach a transect from a project:
 *
 * biigle.projectTransects.detach({pid: projectId, id: transectId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.api.projectTransects = Vue.resource('/api/v1/projects{/pid}/transects{/id}', {}, {
    attach: {method: 'POST'},
    detach: {method: 'DELETE'}
});
