import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annotation guidelines.
 *
 * Create or update a label in a guideline.
 * resource.save({id: projectId}, {description: description, label: label, reference_image: reference_image}).then(...);
 *
 * Delete a reference image
 * resource.delete_image({id: projectId}, {label: labelId).then(...);
 *
 *
 */
export default Resource('api/v1/projects{/id}/annotation-guideline-label',{}, {
    delete_image: {
        method: 'DELETE',
        url: 'api/v1/projects{/id}/annotation-guideline-label/delete-image',
    }
})
