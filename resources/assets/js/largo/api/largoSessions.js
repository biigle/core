import {Resource} from 'vue-resource';

/**
 * Resource for saved Largo sessions.
 *
 * Get the annotations that were not changed when the session was saved:
 * resource.getUnchangedAnnotations({id: 'b02d5d09-df21-4385-9f1a-c3c7d5095e13'}).then(...);
 */
export default Resource('api/v1/largo-sessions{/id}', {}, {
    getUnchangedAnnotations: {
        method: 'GET',
        url: 'api/v1/largo-sessions{/id}/unchanged-annotations',
    },
});
