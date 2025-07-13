import {Resource} from 'vue-resource';

/**
 * Resource for volume PCA visualization data.
 *
 * var resource = biigle.$require('api.volumePcaVisualization');
 *
 * Get PCA visualization data for a volume:
 *
 * var resource = biigle.$require('api.volumePcaVisualization');
 * resource.get({id: volumeId, method: 'pca'}).then(...);
 */
export default Resource('api/v1/volumes{/id}/pca-visualization{?method}');
