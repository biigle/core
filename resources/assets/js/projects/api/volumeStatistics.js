/**
 * Resource for volume that can be attached to a VOLUME.
 *
 * var resource = biigle.$require('api.attachableVolumes');
 *
 * Get all volumes that can be attached to a project:
 *
 * var resource = biigle.$require('api.attachableVolumes');
 * resource.get({id: projectId}).then(...);
 */
export default Vue.resource('api/v1/volumes{/id}/statistics');
