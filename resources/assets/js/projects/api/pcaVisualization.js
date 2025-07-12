import {Resource} from 'vue-resource';

/**
 * Resource for PCA visualization data.
 *
 * var resource = biigle.$require('api.pcaVisualization');
 *
 * Get PCA visualization data for a project:
 *
 * var resource = biigle.$require('api.pcaVisualization');
 * resource.get({id: projectId}).then(...);
 */
export default Resource('api/v1/projects{/id}/pca-visualization');
