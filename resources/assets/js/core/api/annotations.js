import {Resource} from 'vue-resource';

/**
 * Resource for annotations.
 *
 * var resource = biigle.$require('api.annotations');
 *
 * Update an annotation:
 * resource.update({id: 1}, {points: [10, 10]}).then(...);
 *
 * Delete an annotation:
 * resource.delete({id: 1}).then(...);
 *
 * Attach a new label to an annotation:
 * resource.attachLabel({id: 1}, {label_id: 1, confidence: 0.5}).then(...);
 *
 * Detach a label from an annotation:
 * resource.detachLabel({annotation_label_id: id}).then(...);
 * Note that the annotation label ID is required for this and not the annotation ID!
 */
export default Resource('api/v1/annotations{/id}', {}, {
    attachLabel: {
        method: 'POST',
        url: 'api/v1/annotations{/id}/labels',
    },
    detachLabel: {
        method: 'DELETE',
        url: 'api/v1/annotation-labels{/annotation_label_id}',
    },
});
