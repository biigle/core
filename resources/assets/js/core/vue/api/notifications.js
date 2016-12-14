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
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.notifications', Vue.resource('/api/v1/notifications{/id}', {}, {
    markRead: {method: 'PUT'}
}));
