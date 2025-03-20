import {Resource} from 'vue-resource';

/**
 * Resource for requesting reports for volumes
 *
 * let resource = biigle.$require('reports.api.volumeReports');
 *
 * Request a basic annotation report:
 *
 * resource.save({id: 1}, {
 *     type_id: 2,
 *     export_area: 1,
 *     separate_label_trees: 0,
 *     annotation_session_id: 23,
 * }).then(...)
 *
 */
export default Resource('/api/v1/volumes{/id}/reports');
