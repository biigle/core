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
export default Resource('api/v1/projects{/id}/invitations', {}, {
    save: {
        method: 'PUT',
        url: 'api/v1/project-strategy{/id}',
    },
    delete: {
        method: 'DELETE',
        url: 'api/v1/project-strategy{/id}',
    }
});
