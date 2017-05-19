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
                if (store.isInitialized()) {
                    return store.hasUnread();
                }

                // Else take the value of the unread attribute.
                return this.$el.attributes.unread.value === 'true';
            }
        }
    });
});
