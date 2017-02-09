/**
 * Resource for volumes.
 *
 * var resource = biigle.$require('api.volumes');
 *
 * Get IDs of all images of the volume that have a certain image label attached:
 * resource.queryImagesWithImageLabel({id: 1, label_id: 123}).then(...);
 *
 * Get all image labels that were used in the volume:
 * resource.queryImageLabels({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.volumes', Vue.resource('api/v1/volumes{/id}', {}, {
    queryImagesWithImageLabel: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/images/filter/image-label{/label_id}',
    },
    queryImageLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/image-labels',
    }
}));
