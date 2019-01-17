/**
 * Resource for video annotations.
 *
 * var resource = biigle.$require('videos.api.videoAnnotations');
 *
 * List annotations:
 * resource.query({id: videoId}).then(...);
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
 * @type {Vue.resource}
 */
biigle.$declare('videos.api.videoAnnotations', Vue.resource('api/v1/video-annotations{/id}', {}, {
    query: {
        method: 'GET',
        url: 'api/v1/videos{/id}/annotations',
    },
    save: {
        method: 'POST',
        url: 'api/v1/videos{/id}/annotations',
    },
}));
