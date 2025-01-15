<script>
import Store from './store.js';

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
</script>
