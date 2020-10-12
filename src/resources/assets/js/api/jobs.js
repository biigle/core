/**
 * Resource for Largo jobs.
 *
 * Check if a Largo job is still running
 * resource.get({id: "1234").then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/largo-jobs{/id}');
