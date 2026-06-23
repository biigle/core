import {Resource} from 'vue-resource';

/**
 * Resource for project guideline.
 *
 * Create or update a guideline.
 * resource.save({id: projectId, description: description}, {...}).then(...);
 *
 * Delete a guideline.
 * resource.delete({id: projectId}).then(...);
 */
export default Resource('api/v1/projects{/id}/annotation-guideline')
