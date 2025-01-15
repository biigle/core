/**
 * The InAppNotification store.
 *
 * Stores information on InAppNotifications to be shared between multiple JS components.
 */
class Notifications {
    constructor() {
        this.all = [];
        this.initialized = false;
    }

    get unread() {
        return this.all.filter(function (item) {
            return item.read_at === null;
        });
    }

    get count() {
        return this.all.length;
    }

    get countUnread() {
        return this.unread.length;
    }

    remove(id) {
        for (let i = this.all.length - 1; i >= 0; i--) {
            if (this.all[i].id === id) {
                this.all.splice(i, 1);
            }
        }
    }

    initialize(initialNotifications) {
        if (!this.initialized) {
            this.all = initialNotifications || [];
            this.initialized = true;
        }
    }
};

export default new Notifications();
