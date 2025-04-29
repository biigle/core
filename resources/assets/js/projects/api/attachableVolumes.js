import {Resource} from 'vue-resource';

/**
 * Resource for volume that can be attached to a project.
 *
 * var resource = biigle.$require('api.attachableVolumes');
 *
 * Get all volumes that can be attached to a project:
 *
 * var resource = biigle.$require('api.attachableVolumes');
 * resource.get({id: projectId}).then(...);
 */
export default Resource('api/v1/projects{/id}/attachable-volumes{/name}');
