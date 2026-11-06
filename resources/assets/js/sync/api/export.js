import {Resource} from 'vue-resource';

/**
 * Resource for export files.
 *
 * let resource = biigle.$require('sync.api.export');
 *
 * Request a volume export:
 * resource.saveVolumes({only: [1, 2, 3], description: 'My export'}).then(...);
 *
 * Request a label tree export:
 * resource.saveLabelTrees({except: [1]}).then(...);
 *
 * Request a user export:
 * resource.saveUsers({only: [1]}).then(...);
 *
 * Delete an export file:
 * resource.delete({id: 1}).then(...);
 */
export default Resource('api/v1/export-files{/id}', {}, {
    saveVolumes: {
        method: 'POST',
        url: 'api/v1/export/volumes',
    },
    saveLabelTrees: {
        method: 'POST',
        url: 'api/v1/export/label-trees',
    },
    saveUsers: {
        method: 'POST',
        url: 'api/v1/export/users',
    },
});
