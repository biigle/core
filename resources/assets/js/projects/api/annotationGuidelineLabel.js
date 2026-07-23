import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annotation guidelines.
 *
 * Create or update a label in a guideline.
 * resource.save({id: guidelineId}, formData).then(...);
 *
 * Delete a label from a guideline.
 * resource.delete({id: guidelineId, labelId: labelId}).then(...);
 */
export default Resource('api/v1/annotation-guidelines{/id}/labels', {}, {
    delete: {
        method: 'DELETE',
        url: 'api/v1/annotation-guidelines{/id}/labels{/labelId}',
    },
});
