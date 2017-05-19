/**
 * The InAppNotification store.
 *
 * Stores information on InAppNotifications to be shared between multiple JS components.
 */
biigle.$declare('notifications.store', new Vue({
    data: {
        _all: null,
        initialized: false
    },
    computed: {
        all: {
            get: function () {
                return this._all || [];
            },
            set: function (value) {
                this.initialized = true;
                this._all = value;
            }
        },
        unread: function () {
            return this.all.filter(function (item) {
                return item.read_at === null;
            });
        }
    },
    methods: {
        isInitialized: function () {
            return this.initialized;
        },
        count: function () {
            return this.all.length;
        },
        countUnread: function () {
            return this.unread.length;
        },
        hasUnread: function () {
            for (var i = this.all.length - 1; i >= 0; i--) {
                if (this.all[i].read_at === null) return true;
            }

            return false;
        },
        remove: function (id) {
            for (var i = this.all.length - 1; i >= 0; i--) {
                if (this.all[i].id === id) {
                    this.all.splice(i, 1);
                }
            }
        }
    }
}));
