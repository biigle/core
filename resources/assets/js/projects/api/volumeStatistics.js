/**
 * Resource for volume statistics.
 *
 * var resource = biigle.$require('api.volumeStatistics');
 *
 * Get statistics of a volume.
 *
 * var resource = biigle.$require('api.volumeStatistics');
 * resource.get({id: volumeId}).then(...);
 */
export default Vue.resource('api/v1/volumes{/id}/statistics');
