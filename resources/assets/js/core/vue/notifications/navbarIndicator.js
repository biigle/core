/**
 * The notification navbar indicator.
 *
 * Adds a highlight to the notification icon in the navbar if unread notifications
 * are available.
 */
biigle.$viewModel('notifications-navbar-indicator', function (element) {
    new Vue({
        el: element,
        computed: {
            unread: function () {
                // When on the notifications view, update unread state "live"
                if (biigle.notifications.store.isInitialized()) {
                    return biigle.notifications.store.hasUnread();
                }

                // Else take the value of the unread attribute.
                return this.$el.attributes.unread.value === 'true';
            }
        }
    });
});
