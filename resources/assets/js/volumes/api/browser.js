import {Resource} from 'vue-resource';

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
 * Show images:
 * resource.getImages({disk: storageDisk, path: subDirectory}).then(...);
 *
 * Show videos:
 * resource.getVideos({disk: storageDisk, path: subDirectory}).then(...);
 */
export default Resource('api/v1/volumes/browser/directories{/disk}', {}, {
    getImages: {
        method: 'GET',
        url: 'api/v1/volumes/browser/images{/disk}',
    },
    getVideos: {
        method: 'GET',
        url: 'api/v1/volumes/browser/videos{/disk}',
    },
});
