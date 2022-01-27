/**
 * Resource for getting and deleting iFDO files attached to a volume.
 *
 * let resource = biigle.$require('api.volumeIfdo');
 *
 * resource.delete({id: volumeId}).then(...);
 */
export default Vue.resource('api/v1/volumes{/id}/ifdo');
