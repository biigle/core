import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annotation guidelines.
 *
 * Create or update a label in a guideline.
 * resource.save({id: guidelineId}, formData).then(...);
 */
export default Resource('api/v1/annotation-guidelines{/id}/labels');
