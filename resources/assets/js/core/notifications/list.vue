<script>
import NotificationsApi from './../api/notifications';
import Store from './store';
import Messages from './../messages/store';

/**
 * The notification list.
 *
 * Displays all InAppNotifications of the user in a list.
 */

let notification = {
    props: ['item', 'removeItem'],
    data() {
        return {
            isLoading: false
        };
    },
    computed: {
        classObject() {
            if (this.item.data.type) {
                return `panel-${this.item.data.type}`;
            }

            return 'panel-default';
        },
        isUnread() {
            return this.item.read_at === null;
        }
    },
    methods: {
        markRead() {
            this.isLoading = true;
            return NotificationsApi.markRead({id: this.item.id}, {})
                .then(() => {
                    this.item.read_at = new Date();
                    if (this.removeItem) {
                        Store.remove(this.item.id);
                    }
                })
                .catch(Messages.handleErrorResponse)
                .finally(() => {
                    this.isLoading = false;
                });
        },
        markReadAndOpenLink() {
            let link = this.item.data.actionLink;
            if (this.item.read_at) {
                window.location = link;
            } else {
                this.markRead().finally(function () {
                    window.location = link;
                });
            }
        },
    },
};

export default {
    components: {
        notification: notification
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
        Store.initialize();
        this.notifications = Store.all;
    },
};
</script>
