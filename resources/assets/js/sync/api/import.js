/**
 * Resource for imports.
 *
 * let resource = biigle.$require('sync.api.import');
 *
 * Perform an import:
 * resource.update({token: '123abc'}, {only: [1,2,3,...], ...}).then(...);
 *
 * Delete an import:
 * resource.delete({token: '123abc'}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/import{/token}');
