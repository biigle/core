/**
 * Resource for volumes.
 *
 * let resource = biigle.$require('api.volumes');
 *
 * Get IDs of all files of the volume that have labels attached:
 * resource.queryFilesWithFileLabels({id: 1).then(...);
 *
 * Get IDs of all files of the volume that have a certain label attached:
 * resource.queryFilesWithLabel({id: 1, label_id: 123}).then(...);
 *
 * Get IDs of all file of the volume that have file labels attached by a certain user:
 * resource.queryFilesWithLabelFromUser({id: 1, user_id: 123}).then(...);
 *
 * Get IDs of all files of the volume that have a filename matching the given pattern:
 * resource.queryFilesWithFilename({id: 1, pattern: '*def.jpg'}).then(...);
 *
 * Get all file labels that were used in the volume:
 * resource.queryUsedFileLabels({id: 1}).then(...);
 *
 * Get all file names of the volume:
 * resource.queryFilenames({id: 1}).then(...);
 *
 * Get all the similarity indices of the volume:
 * resource.querySimilarityIndices({id: volumeId}).then(...)
 * Get all users that have access to a volume:
 * resource.queryUsers({id: 1}).then(...);
 *
 * Get IDs of all files of the volume:
 * resource.queryFiles({id: 1}).then(...);
 *
 * Add files to a volume:
 * resource.saveFiles({id: 1}, {files: '1.jpg, 2.jpg'}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/volumes{/id}', {}, {
    queryFilesWithFileLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/labels',
    },
    queryFilesWithLabel: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/labels{/label_id}',
    },
    queryFilesWithLabelFromUser: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/labels/users{/user_id}',
    },
    queryFilesWithFilename: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/filename{/pattern}',
    },
    queryUsedFileLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/file-labels',
    },
    queryFilenames: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/filenames',
    },
    querySimilarityIndices: {
        method: 'GET',
        url: 'api/v1/volumes/{$id}/similarity-indices',
    },
    queryFileLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/labels',
    },
    queryUsers: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/users',
    },
    queryFiles: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files',
    },
    saveFiles: {
        method: 'POST',
        url: 'api/v1/volumes{/id}/files',
    },
    queryFilesWithAnnotations: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/annotations',
    },
    queryFilesWithAnnotationLabel: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/annotation-label{/label_id}',
    },
    queryFilesWithAnnotationFromUser: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/files/filter/annotation-user{/user_id}',
    },
    queryAnnotationLabels: {
        method: 'GET',
        url: 'api/v1/volumes{/id}/annotation-labels',
    },
});
