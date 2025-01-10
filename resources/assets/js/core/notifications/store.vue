<script>
/**
 * The InAppNotification store.
 *
 * Stores information on InAppNotifications to be shared between multiple JS components.
 */
export default new Vue({
    data() {
        return {
            all: [],
            initialized: false
        };
    },
    computed: {
        unread() {
            return this.all.filter(function (item) {
                return item.read_at === null;
            });
        },
        count() {
            return this.all.length;
        },
        countUnread() {
            return this.unread.length;
        },
    },
    methods: {
        remove(id) {
            for (let i = this.all.length - 1; i >= 0; i--) {
                if (this.all[i].id === id) {
                    this.all.splice(i, 1);
                }
            }
        },
        initialize() {
            if (!this.initialized) {
                let initialNotifications = biigle.$require('initialNotifications');
                this.all = initialNotifications || [];
                this.initialized = true;
            }
        },
    },
});
</script>
