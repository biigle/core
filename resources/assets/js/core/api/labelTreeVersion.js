import {Resource} from 'vue-resource';

/**
 * Resource for label tree versions.
 *
 * var resource = biigle.$require('api.labelTreeVersion');
 *
 * Create a new label tree version:
 * resource.save({id: labelTreeId}, {name: "v1.0").then(...);

 * Delete a label tree version:
 * resource.delete({id: 1}).then(...);
 */
export default Resource('api/v1/label-tree-versions{/id}', {}, {
    save: {
        method: 'POST',
        url: 'api/v1/label-trees{/id}/version',
    },
});
