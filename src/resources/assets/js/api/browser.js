/**
 * Resource for the volume file browser
 *
 * let resource = biigle.$require('api.volumes.browser');
 *
 * Show root directories:
 * resource.get({disk: storageDisk}).then(...);
 *
 * Show subdirectories:
 * resource.get({disk: storageDisk, path: subDirectory}).then(...);
 *
 * Show image files:
 * resource.getImages({disk: storageDisk, path: subDirectory}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/volumes/browser/directories{/disk}', {}, {
    getImages: {
        method: 'GET',
        url: 'api/v1/volumes/browser/images{/disk}',
    },
});
