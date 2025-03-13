import {Resource} from 'vue-resource';

/**
 * Resource for video annotations.
 *
 * let resource = biigle.$require('videos.api.videoAnnotations');
 *
 * List annotations:
 * resource.query({id: videoId}).then(...);
 *
 * Show a single annotation:
 * resource.get({id: annotationId}).then(...);
 *
 * Create an annotation:
 * resource.save({id: videoId}, {points: [[10, 10]], ...}).then(...)
 *
 * Update an annotation:
 * resource.update({id: annotationId}, {points: [[20, 20]], ...}).then(...);
 *
 * Delete an annotation:
 * resource.delete({id: annotationId}).then(...);
 *
 * Split an annotation:
 * resource.split({id: annotationId}, {time: splitTime}).then(...);
 *
 * Link two annotations:
 * resource.link({id: firstId}, {annotation_id: secondId}).then(...);
 *
 * Attach a label:
 * resource.attachLabel({id: annotationId}, {label_id: labelId}).then(...);
 *
 * Detach a label:
 * resource.detachLabel({id: annotationLabelId}).then(...);
 */
export default Resource('api/v1/video-annotations{/id}', {}, {
    query: {
        method: 'GET',
        url: 'api/v1/videos{/id}/annotations',
    },
    save: {
        method: 'POST',
        url: 'api/v1/videos{/id}/annotations',
    },
    split: {
        method: 'POST',
        url: 'api/v1/video-annotations{/id}/split',
    },
    link: {
        method: 'POST',
        url: 'api/v1/video-annotations{/id}/link',
    },
    attachLabel: {
        method: 'POST',
        url: 'api/v1/video-annotations{/id}/labels',
    },
    detachLabel: {
        method: 'DELETE',
        url: 'api/v1/video-annotation-labels{/id}',
    },
});
