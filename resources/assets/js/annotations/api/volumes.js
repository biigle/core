import {Resource} from 'vue-resource';

/**
 * Resource for the area of images of a volume.
 *
 * var resource = biigle.$require('annotations.api.volumeImageArea');
 *
 * Get the area in m² of all images of the volume:
 * resource.get({id: 1}).then(...);
 */
export default Resource('api/v1/volumes{/id}/images/area');

