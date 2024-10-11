/**
 * Resource for the area of images of a volume.
 *
 * var resource = biigle.$require('annotations.api.volumeImageArea');
 *
 * Get the area in m² of all images of the volume:
 * resource.get({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/volumes', {}, {
    getArea: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/images/area',
    },
    getLastAnnotationId: {
        method: 'GET',
        url: 'api/v1/volumes/images{/id}'
    }
});
