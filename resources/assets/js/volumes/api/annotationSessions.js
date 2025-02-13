import {Resource} from 'vue-resource';

/**
 * Resource for annotation sessions.
 *
 * let resource = biigle.$require('api.annotationSessions');
 *
 * Get all annotation sessions of a volume:
 * resource.query({volume_id: 1}).then(...);
 *
 * Create a new annotation session:
 * resource.save({volume_id: 1}, {
 *    name: 'My annotation session',
 *    starts_at: '2016-09-20',
 *    ends_at: '2016-09-25',
 *    description: 'This is my first annotation session!',
 *    hide_other_users_annotations: true,
 *    hide_own_annotations: false,
 * }).then(...);
 *
 * Update a session:
 * resource.update({id: 2}, {name: 'Updated name'}).then(...);
 *
 * Delete a session:
 * resource.delete({id: 2}).then(...);
 */
export default Resource('api/v1/annotation-sessions{/id}', {}, {
    query: {
        method: 'GET',
        url: 'api/v1/volumes{/volume_id}/annotation-sessions',
    },
    save: {
        method: 'POST',
        url: 'api/v1/volumes{/volume_id}/annotation-sessions',
    },
});
