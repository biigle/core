/**
 * The popup message display.
 *
 * Shows and handles closing of new popup messages.
 */
biigle.$viewModel('messages-display', function (element) {
    var store = biigle.$require('messages.store');

    var message = {
        props: {
            id: {
                type: Number,
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                default: 'info',
            },
        },
        computed: {
            typeClass: function () {
                return 'alert-' + this.type;
            },
        },
        methods: {
            close: function () {
                store.close(this.id);
            },
            cancelTimeout: function () {
                if (this.closeTimeoutId) {
                    window.clearTimeout(this.closeTimeoutId);
                    this.closeTimeoutId = null;
                }
            }
        },
        mounted: function () {
            if (this.type !== 'danger') {
                this.closeTimeoutId = window.setTimeout(this.close, 15000);
            }
        },
    };

    new Vue({
        el: element,
        components: {
            message: message
        },
        data: {
            messages: store.all
        },
        created: function () {
            var message = biigle.$require('staticMessage');
            if (message.text && message.type) {
                // Wait for nextTick so the message animation works.
                this.$nextTick(function () {
                    store.post(message.type, message.text);
                });
            }
        },
    });
});
