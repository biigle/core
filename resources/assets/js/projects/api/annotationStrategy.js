import {Resource} from 'vue-resource';

/**
 * Resource for project strategies.
 *
 * Create or update a strategy.
 * resource.save({id: projectId, description: description}, {...}).then(...);
 *
 * Delete a strategy.
 * resource.delete({id: projectId}).then(...);
 */
export default Resource('api/v1/projects{/id}/annotation-strategy')
