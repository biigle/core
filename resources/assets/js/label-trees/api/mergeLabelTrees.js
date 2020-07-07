/**
 * Resource for merging of label trees.
 *
 * var resource = biigle.$require('api.annotations');
 *
 * Merge label trees:
 * resource.save({id: 1}, {add: [...], remove: [...]}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/label-trees{/id}/merge-labels');
