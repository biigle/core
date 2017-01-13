/**
 * Resource for uploading volume image metadata as CSV.
 *
 * var resource = biigle.$require('api.volumeImageMetadata');
 * var data = new FormData();
 * data.append('file', fileInputElement.files[0]);
 *
 * resource.save({id: volumeId}, data).then(...);
 */
biigle.$declare('api.volumeImageMetadata', Vue.resource('/api/v1/volumes{/id}/images/metadata'));
