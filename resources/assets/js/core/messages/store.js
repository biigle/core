/**
 * The popup message store.
 */
biigle.$declare('messages.store', new Vue({
    data: {
        // Maximum number of messages to display until the oldest is automatically
        // removed.
        max: 1,
        all: [],
    },
    methods: {
        post: function (type, text) {
            // Exit fullscreen mode so the popup message is visible.
            biigle.$require('utils.cb').exitFullscreen();

            this.all.unshift({
                id: Date.now(),
                type: type,
                text: text
            });

            if (this.all.length > this.max) {
                this.all.pop();
            }
        },
        danger: function (text) {
            this.post('danger', text);
        },
        warning: function (text) {
            this.post('warning', text);
        },
        success: function (text) {
            this.post('success', text);
        },
        info: function (text) {
            this.post('info', text);
        },
        close: function (id) {
            for (var i = this.all.length - 1; i >= 0; i--) {
                if (this.all[i].id === id) {
                    this.all.splice(i, 1);
                }
            }
        },
        handleErrorResponse: function (response) {
            var data = response.body;

            if (data) {
                if (data.message) {
                    // error response
                    this.danger(data.message);
                    return;
                } else if (typeof data === 'string') {
                    // unknown error response
                    this.danger(data);
                    return;
                }
            }

            if (response.status === 422) {
                // validation response
                for (var key in data) {
                    this.danger(data[key][0]);
                }
            } else if (response.status === 403) {
                this.danger("You have no permission to do that.");
            } else if (response.status === 401) {
                this.danger("Please log in (again).");
            } else {
                this.danger("The server didn't respond, sorry.");
            }
        },
        // I always mix this up...
        handleResponseError: function (response) {
            return this.handleErrorResponse(response);
        },
    },
}));

// To support the legacy AngularJS biigle.ui.messages msg service
$biiglePostMessage = biigle.$require('messages.store.post');
