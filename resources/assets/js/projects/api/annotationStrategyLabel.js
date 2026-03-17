import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annotation strategies.
 *
 * Create or update a label in a strategy.
 * resource.save({id: projectId, descriptions: [description], labels: [labels]}, {...}).then(...);
 *
 * Upload a reference image and returns the uploaded filename
 * resource.upload_image({id: projectId, file: file}, {...}).then(...);
 *
 * Delete a reference image
 * resource.delete_image({id: projectId, descriptions: [description], labels: [labels]}, {...}).then(...);
 *
 */
export default Resource('api/v1/projects{/id}/annotation-strategy-label',{}, {
    upload_image: {
        method: 'POST',
        url: 'api/v1/projects{/id}/annotation-strategy-label/upload-image',
    },
    delete_image: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/annotation-strategy-label/delete-image',
    }
})
