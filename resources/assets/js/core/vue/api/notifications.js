/**
 * Resource for DB notifications.
 *
 * Mark as read:
 *
 * biigle.api.notifications.markRead({id: notificationId}, {}).then(...)
 *
 * Delete:
 *
 * biigle.api.notifications.markRead({id: notificationId}).then(...)
 *
 * @type {Vue.resource}
 */
biigle.api.notifications = Vue.resource('/api/v1/notifications{/id}', {}, {
    markRead: {method: 'PUT'}
});
