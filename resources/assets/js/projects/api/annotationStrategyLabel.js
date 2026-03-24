import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annotation strategies.
 *
 * Create or update a label in a strategy.
 * resource.save({id: projectId, descriptions: [description], labels: [labels]}, {...}).then(...);
 *
 * Delete a reference image
 * resource.delete_image({id: projectId, descriptions: [description], labels: [labels]}, {...}).then(...);
 *
 */
export default Resource('api/v1/projects{/id}/annotation-strategy-label',{}, {
    delete_image: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/annotation-strategy-label/delete-image',
    }
})
