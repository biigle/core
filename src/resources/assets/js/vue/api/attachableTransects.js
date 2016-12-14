/**
 * Resource for transect that can be attached to a project.
 *
 * Get all transects that can be attached to a project:
 *
 * var resource = biigle.$require('api.attachableTransects');
 * resource.get({id: projectId}).then(...);
 */
biigle.$declare('api.attachableTransects', Vue.resource('/api/v1/projects{/id}/attachable-transects'));
