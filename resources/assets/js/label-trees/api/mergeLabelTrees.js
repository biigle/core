import {Resource} from 'vue-resource';

/**
 * Resource for merging of label trees.
 *
 * var resource = biigle.$require('api.annotations');
 *
 * Merge label trees:
 * resource.save({id: 1}, {add: [...], remove: [...]}).then(...);
 */
export default Resource('api/v1/label-trees{/id}/merge-labels');
