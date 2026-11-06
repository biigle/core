import {Resource} from 'vue-resource';

/**
 * Resource for annotation guidelines.
 *
 * Get the guideline for a project.
 * resource.get({id: projectId}).then(...);
 *
 * Create a guideline for a project.
 * resource.save({id: projectId}, {description: '...'}).then(...);
 *
 * Update a guideline by its ID.
 * resource.update({id: guidelineId}, {description: '...'}).then(...);
 *
 * Delete a guideline by its ID.
 * resource.delete({id: guidelineId}).then(...);
 */
export default Resource('api/v1/projects{/id}/annotation-guidelines', {}, {
    update: {
        method: 'PUT',
        url: 'api/v1/annotation-guidelines{/id}',
    },
    delete: {
        method: 'DELETE',
        url: 'api/v1/annotation-guidelines{/id}',
    },
});
