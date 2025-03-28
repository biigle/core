import {Resource} from 'vue-resource';

/**
 * Resource for finding labels from an external source.
 *
 * var resource = biigle.$require('api.labelSource');
 *
 * Find labels:
 *
 * resource.query({id: 1, query: 'Kolga'}).then(...);
 */
export default Resource('api/v1/label-sources{/id}/find');
