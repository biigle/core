/**
 * Resource for transect sample thumbnails.
 *
 * var resource = biigle.$require('api.transectSample');
 *
 * Get samples:
 *
 * resource.get({id: transectId}, {}).then(...)
 *
 * Get 2 samples:
 *
 * resource.get({id: transectId, number: 2}, {}).then(...)
 */
biigle.$declare('api.transectSample', Vue.resource('/api/v1/transects{/id}/sample{/number}'));
