import Store from './store';

/**
 * The notification unread count.
 *
 * Shows the number of unread notifications.
 */
export default {
    computed: {
        count() {
            return Store.countUnread;
        },
    },
};
