/**
 * Resource for project invitations.
 *
 * Get statistics of a volume.
 *
 * resource.save({id: projectId}, {...}).then(...);
 */
export default Vue.resource('api/v1/projects{/id}/invitations');
