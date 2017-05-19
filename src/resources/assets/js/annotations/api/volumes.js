/**
 * Resource for editing the export area of a volume
 *
 * var resource = biigle.$require('export.api.volumes');
 *
 * Get the export area:
 * resource.get({id: volumeId}).then(...);
 *
 * Create/update an export area:
 * resource.save({id: volumeId}, {coordinates: [10, 10, 100, 100]}).then(...);
 *
 * Delete the export area:
 * resource.delete({id: columeId}).then(...);
 *
 */
biigle.$declare('export.api.volumes', Vue.resource('/api/v1/volumes{/id}/export-area'));
