import {Resource} from 'vue-resource';

/**
 * Resource for video labels.
 *
 * let resource = biigle.$require('api.videoLabels');
 *
 * Get all labels of an video:
 * resource.query({video_id: 1}).then(...);
 *
 * Attach a new label to an video:
 * resource.save({video_id: 1}, {label_id: 2}).then(...);
 *
 * Detach a label:
 * resource.delete({id: label_id}).then(...);
 */
export default Resource('api/v1/video-labels{/id}', {}, {
    query: {
        method: 'GET',
        url: 'api/v1/videos{/video_id}/labels',
    },
    save: {
        method: 'POST',
        url: 'api/v1/videos{/video_id}/labels',
    },
});
