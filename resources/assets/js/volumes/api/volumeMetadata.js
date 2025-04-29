import {Resource} from 'vue-resource';

/**
 * Resource for uploading volume image metadata as CSV.
 *
 * let resource = biigle.$require('api.volumeMetadata');
 * let data = new FormData();
 * data.append('file', fileInputElement.files[0]);
 *
 * resource.save({id: volumeId}, data).then(...);
 */
export default Resource('api/v1/volumes{/id}/metadata');
