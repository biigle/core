import {Resource} from 'vue-resource';

/**
 * Resource for image labels.
 *
 * let resource = biigle.$require('api.imageLabels');
 *
 * Get all labels of an image:
 * resource.query({image_id: 1}).then(...);
 *
 * Attach a new label to an image:
 * resource.save({image_id: 1}, {label_id: 2}).then(...);
 *
 * Detach a label:
 * resource.delete({id: label_id}).then(...);
 */
export default Resource('api/v1/image-labels{/id}', {}, {
    query: {
        method: 'GET',
        url: 'api/v1/images{/image_id}/labels',
    },
    save: {
        method: 'POST',
        url: 'api/v1/images{/image_id}/labels',
    },
});
