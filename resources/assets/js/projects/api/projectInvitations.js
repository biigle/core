import {Resource} from 'vue-resource';

/**
 * Resource for project invitations.
 *
 * Create an invitations.
 * resource.save({id: projectId}, {...}).then(...);
 *
 * Delete an invitations.
 * resource.delete({id: invitationId}).then(...);
 */
export default Resource('api/v1/projects{/id}/invitations', {}, {
    delete: {
        method: 'DELETE',
        url: 'api/v1/project-invitations{/id}',
    }
});
