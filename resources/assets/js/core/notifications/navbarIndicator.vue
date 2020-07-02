<script>
import Store from './store';

/**
 * The notification navbar indicator.
 *
 * Adds a highlight to the notification icon in the navbar if unread notifications
 * are available.
 */

export default {
    computed: {
        unread() {
            // When on the notifications view, update unread state "live"
            if (Store.initialized) {
                return Store.countUnread;
            }

            // Else take the value of the unread attribute.
            return parseInt(this.$el.attributes.unread.value);
        },
        hasUnread() {
            return this.unread > 0;
        },
        unreadText() {
            return this.hasUnread ? this.unread : 'no';
        },
        title() {
            return `You have ${this.unreadText} unread notification(s)`;
        },
    }
};
</script>
