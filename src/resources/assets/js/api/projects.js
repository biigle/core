/**
 * Resource for Largo operations on projects.
 *
 * var resource = biigle.$require('largo.api.projects');
 *
 * Get all image annotations with a specific label:
 * resource.queryImageAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Get all video annotations with a specific label:
 * resource.queryVideoAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed_image_annotations: {1: [...]}, changed_image_annotations: {12: 1, ...}, dismissed_video_annotations: {1: [...]}, changed_video_annotations: {12: 1, ...}}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/projects{/id}/largo', {}, {
    queryImageAnnotations: {
        method: 'GET',
        url: 'api/v1/projects{/id}/image-annotations/filter/label{/label_id}',
    },
    queryVideoAnnotations: {
        method: 'GET',
        url: 'api/v1/projects{/id}/video-annotations/filter/label{/label_id}',
    },
    sortAnnotationsByOutlier: {
        method: 'GET',
        url: 'api/v1/projects{/id}/annotations/sort/outliers{/label_id}',
    },
    sortAnnotationsBySimilarity: {
        method: 'GET',
        url: 'api/v1/projects{/id}/annotations/sort/similarity',
    },
});
