/**
 * The notification unread count.
 *
 * Shows the number of unread notifications.
 */
biigle.$viewModel('notifications-unread-count', function (element) {
    var store = biigle.$require('notifications.store');

    new Vue({
        el: element,
        computed: {
            count: store.countUnread
        }
    });
});
