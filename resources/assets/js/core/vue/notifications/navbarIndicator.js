biigle.notifications.navbarIndicator = document.getElementById('notifications-navbar-indicator');

window.addEventListener('load', function () {
    if (biigle.notifications.navbarIndicator) {
        new Vue({
            el: biigle.notifications.navbarIndicator,
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
    }
});
