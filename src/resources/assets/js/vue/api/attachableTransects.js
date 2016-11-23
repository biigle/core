/**
 * Resource for transect that can be attached to a project.
 *
 * Get all transects that can be attached to a project:
 *
 * biigle.api.attachableTransects.get({id: projectId}).then(...);
 */
biigle.api.attachableTransects = Vue.resource('/api/v1/projects{/id}/attachable-transects');
