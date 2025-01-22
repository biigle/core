<script>
import NotificationsApi from '../api/notifications.js';
import Store from './store.js';
import Messages from '../messages/store.js';
import Notification from './notification.vue';

export default {
    components: {
        notification: Notification
    },
    data() {
        return {
            notifications: [],
            isLoading: false,
        };
    },
    computed: {
        hasNotifications() {
            return Store.count > 0;
        },
        hasUnreadNotifications() {
            return Store.countUnread > 0;
        },
    },
    methods:{
        markAllAsRead() {
            this.isLoading = true;
            return NotificationsApi.markReadAll({}, {})
                .then(() => {
                    this.notifications.map(item => {
                        item.read_at = new Date();
                        Store.remove(item.id);
                    });
                })
                .catch(Messages.handleErrorResponse)
                .finally(() => {
                    this.isLoading = false;
                });
        }
    },
    created() {
        Store.initialize(biigle.$require('initialNotifications'));
        this.notifications = Store.all;
    },
};
</script>
