/**
 * Resource for requesting reports
 *
 * var resource = biigle.$require('export.api.reports');
 *
 * Request a basic annotation report for a project:
 *
 * resource.request({
 *     id: 1,
 *     model: 'projects',
 *     type: 'annotations',
 *     variant: 'basic',
 * }, {
 *     exportArea: 1,
 *     separateLabelTrees: 0,
 * }).then(...)
 *
 */
biigle.$declare('export.api.reports', Vue.resource('/api/v1{/model}{/id}/reports{/type}{/variant}', {}, {
    request: {
        method: 'POST'
    }
}));
