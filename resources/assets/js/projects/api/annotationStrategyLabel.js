import {Resource} from 'vue-resource';

/**
 * Resource for the labels within annoation strategies.
 *
 * Create or update a label in a strategy.
 * resource.save({id: projectId, descriptions: [description], labels: [labels]}, {...}).then(...);
 *
 */
export default Resource('api/v1/projects{/id}/annotation-strategy-label',{}, {
    upload_file: {
        method: 'POST',
        url: 'api/v1/projects{/id}/annotation-strategy-label/upload-image',
    }
})
