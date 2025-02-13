import {Resource} from 'vue-resource';

/**
 * Resource for DB notifications.
 *
 * var resource = biigle.$require('api.notifications');
 *
 * Mark as read:
 *
 * resource.markRead({id: notificationId}, {}).then(...)
 *
 * Delete:
 *
 * resource.delete({id: notificationId}).then(...)
 */
export default Resource('api/v1/notifications{/id}', {}, {
    markRead: {method: 'PUT'},
    markReadAll: {
        method: 'PUT',
        url: 'api/v1/notifications/all'}
});

