/**
 * The popup message display.
 *
 * Shows and handles closing of new popup messages.
 */
biigle.$viewModel('messages-display', function (element) {
    var store = biigle.$require('messages.store');

    var message = {
        props: ['message'],
        computed: {
            typeClass: function () {
                if (this.message.type) {
                    return 'alert-' + this.message.type;
                }

                return 'alert-info';
            }
        },
        methods: {
            close: function () {
                if (this.message) {
                    store.close(this.message.id);
                } else {
                    // This is for popup messages pushed from the server directly into
                    // the HTML. Since these messages are not present in the message
                    // store, we simply remove the DOM element.
                    this.$el.remove();
                }
            }
        }
    };

    new Vue({
        el: element,
        components: {
            message: message
        },
        data: {
            messages: store.all
        }
    });
});
