/**
 * The notification unread count.
 *
 * Shows the number of unread notifications.
 */
biigle.$viewModel('notifications-unread-count', function (element) {
    new Vue({
        el: element,
        computed: {
            count: biigle.notifications.store.countUnread
        }
    });
});
