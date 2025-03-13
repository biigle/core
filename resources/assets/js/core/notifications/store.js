import {reactive, computed} from 'vue';

/**
 * The InAppNotification store.
 *
 * Stores information on InAppNotifications to be shared between multiple JS components.
 */
class Notifications {
    constructor() {
        this.all = reactive([]);
        this.initialized = false;
    }

    get unread() {
        return computed(() => {
            return this.all.filter(function (item) {
                return item.read_at === null;
            });
        });
    }

    get count() {
        return this.all.length;
    }

    get countUnread() {
        return this.unread.value.length;
    }

    remove(id) {
        for (let i = this.all.length - 1; i >= 0; i--) {
            if (this.all[i].id === id) {
                this.all.splice(i, 1);
            }
        }
    }

    clear() {
        this.all.length = 0;
    }

    initialize(initialNotifications) {
        if (!this.initialized) {
            this.all = reactive(initialNotifications || []);
            this.initialized = true;
        }
    }
}

export default new Notifications();
