/**
 * The notification list.
 *
 * Displays all InAppNotifications of the user in a list.
 */
biigle.$viewModel('notifications-list', function (element) {
    var notifications = biigle.$require('api.notifications');
    var notificationStore = biigle.$require('notifications.store');
    var messageStore = biigle.$require('messages.store');

    var notification = {
        props: ['item', 'removeItem'],
        data: function () {
            return {
                isLoading: false
            };
        },
        computed: {
            classObject: function () {
                if (this.item.data.type) {
                    return 'panel-' + this.item.data.type;
                }

                return 'panel-default';
            },
            isUnread: function () {
                return this.item.read_at === null;
            }
        },
        methods: {
            markRead: function () {
                var self = this;
                this.isLoading = true;
                return notifications.markRead({id: this.item.id}, {})
                    .then(function (response) {
                        self.item.read_at = new Date();
                        if (self.removeItem) {
                            notificationStore.remove(self.item.id);
                        }
                    })
                    .catch(messageStore.handleErrorResponse)
                    .finally(function () {
                        self.isLoading = false;
                    });
            },
            markReadAndOpenLink: function () {
                var link = this.item.data.actionLink;
                if (this.item.read_at) {
                    window.location = link;
                } else {
                    this.markRead().finally(function () {
                        window.location = link;
                    });
                }
            },
        }
    };

    new Vue({
        el: element,
        components: {
            notification: notification
        },
        data: {
            notifications: notificationStore.all
        },
        computed: {
            hasNotifications: function () {
                return notificationStore.count > 0;
            },
            hasUnreadNotifications: function () {
                return notificationStore.countUnread > 0;
            },
        }
    });
});
