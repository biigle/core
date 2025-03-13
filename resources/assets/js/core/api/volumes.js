import {Resource} from 'vue-resource';

/**
 * Resource for volumes.
 *
 * var resource = biigle.$require('api.volumes');
 *
 * Get all volumes accessible by the current user:
 * resource.query().then(...);
 *
 * Get one volume:
 * resource.get({id: 1}).then(...);
 *
 * Update a volume:
 * resource.update({id: 1}, {name: 'New Name'}).then(...);
 */
export default Resource('api/v1/volumes{/id}');
