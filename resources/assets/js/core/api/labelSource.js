/**
 * Resource for finding labels from an external source.
 *
 * var resource = biigle.$require('api.labelSource');
 *
 * Find labels:
 *
 * resource.query({id: 1, query: 'Kolga'}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/label-sources{/id}/find');
