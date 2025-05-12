import {Resource} from 'vue-resource';

/**
 * Resource for labels.
 *
 * var resource = biigle.$require('api.labels');
 *
 * Create a label:
 *
 * resource.save({label_tree_id: 1}, {
 *     name: "Trash",
 *     color: 'bada55'
 * }).then(...);
 *
 * Update a label:
 *
 * resource.update({id: labelId}, {
 *     name: "New name",
 *     color: "c0ffee"
 * }).then(...)
 *
 * Delete a label:
 *
 * resource.delete({id: labelId}).then(...);
 */
export default Resource('api/v1/labels{/id}', {}, {
    save: {
        method: 'POST',
        url: 'api/v1/label-trees{/label_tree_id}/labels',
    }
});
