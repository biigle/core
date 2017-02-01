/**
 * Resource for volume sample thumbnails.
 *
 * var resource = biigle.$require('api.volumeSample');
 *
 * Get samples:
 *
 * resource.get({id: volumeId}, {}).then(...)
 *
 * Get 2 samples:
 *
 * resource.get({id: volumeId, number: 2}, {}).then(...)
 */
biigle.$declare('api.volumeSample', Vue.resource('/api/v1/volumes{/id}/sample{/number}'));
