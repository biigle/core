/**
 * Resource for transect sample thumbnails.
 *
 * Get samples:
 *
 * biigle.api.transectSample.get({id: transectId}, {}).then(...)
 *
 * Get 2 samples:
 *
 * biigle.api.transectSample.get({id: transectId, number: 2}, {}).then(...)
 */
biigle.api.transectSample = Vue.resource('/api/v1/transects{/id}/sample{/number}');
