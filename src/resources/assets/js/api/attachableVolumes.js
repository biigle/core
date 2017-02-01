/**
 * Resource for volume that can be attached to a project.
 *
 * Get all volumes that can be attached to a project:
 *
 * var resource = biigle.$require('api.attachableVolumes');
 * resource.get({id: projectId}).then(...);
 */
biigle.$declare('api.attachableVolumes', Vue.resource('/api/v1/projects{/id}/attachable-volumes'));
