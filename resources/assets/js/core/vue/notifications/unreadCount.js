biigle.notifications.unreadCount = document.getElementById('notifications-unread-count');

window.addEventListener('load', function () {
    if (biigle.notifications.unreadCount) {
        new Vue({
            el: biigle.notifications.unreadCount,
            computed: {
                count: biigle.notifications.store.countUnread
            }
        });
    }
});
