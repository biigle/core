import Store from './store';

/**
 * The notification unread count.
 *
 * Shows the number of unread notifications.
 */
export default new Vue({
    computed: {
        count() {
            return Store.countUnread;
        },
    },
});
