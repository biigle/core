<script>
import Store from './store.vue';

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
