/**
 * The notification navbar indicator.
 *
 * Adds a highlight to the notification icon in the navbar if unread notifications
 * are available.
 */
biigle.$viewModel('notifications-navbar-indicator', function (element) {
    var store = biigle.$require('notifications.store');

    new Vue({
        el: element,
        computed: {
            unread: function () {
                // When on the notifications view, update unread state "live"
                if (store.initialized) {
                    return store.countUnread;
                }

                // Else take the value of the unread attribute.
                return parseInt(this.$el.attributes.unread.value);
            },
            hasUnread: function () {
                return this.unread > 0;
            },
            title: function () {
                return 'You have ' + (this.hasUnread ? this.unread : 'no') + ' unread notifications';
            },
        }
    });
});
