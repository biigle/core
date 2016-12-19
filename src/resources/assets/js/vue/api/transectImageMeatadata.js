/**
 * Resource for uploading transect image metadata as CSV.
 *
 * var resource = biigle.$require('api.transectImageMetadata');
 * var data = new FormData();
 * data.append('file', fileInputElement.files[0]);
 *
 * resource.save({id: transectId}, data).then(...);
 */
biigle.$declare('api.transectImageMetadata', Vue.resource('/api/v1/transects{/id}/images/metadata'));
