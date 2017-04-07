/**
 * Resource for annotations in volumes.
 *
 * var resource = biigle.$require('annotations.api.volumes');
 *
 * Get IDs of all images of the volume that have annotations:
 * resource.queryImagesWithAnnotations({id: 1).then(...);
 *
 * Get IDs of all images of the volume that have annotations with a certain image label:
 * resource.queryImagesWithAnnotationLabel({id: 1, label_id: 123}).then(...);
 *
 * Get IDs of all images of the volume that have annotations created by a certain user:
 * resource.queryImagesWithAnnotationFromUser({id: 1, user_id: 123}).then(...);
 *
 * Get all annotation labels that were used in the volume:
 * resource.queryAnnotationLabels({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('annotations.api.volumes', Vue.resource('api/v1/volumes{/id}', {}, {
    queryImagesWithAnnotations: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/images/filter/annotations',
    },
    queryImagesWithAnnotationLabel: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/images/filter/annotation-label{/label_id}',
    },
    queryImagesWithAnnotationFromUser: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/images/filter/annotation-user{/user_id}',
    },
    queryAnnotationLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/annotation-labels',
    },
}));
