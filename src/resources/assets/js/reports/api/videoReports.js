/**
 * Resource for requesting reports for videos
 *
 * let resource = biigle.$require('reports.api.videoReports');
 *
 * Request a CSV report:
 *
 * resource.save({id: 1}, {
 *     type_id: 8,
 *     separate_label_trees: true,
 * }).then(...)
 *
 */
biigle.$declare('reports.api.videoReports', Vue.resource('/api/v1/videos{/id}/reports'));
