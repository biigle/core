<script>
import {exitFullscreen} from '../utils.js';

/**
 * The popup message store.
 */
let store = new Vue({
    data: {
        // Maximum number of messages to display until the oldest is automatically
        // removed.
        max: 1,
        all: [],
    },
    methods: {
        post(type, text) {
            // Exit fullscreen mode so the popup message is visible.
            exitFullscreen();

            this.all.unshift({
                id: Date.now(),
                type: type,
                text: text
            });

            if (this.all.length > this.max) {
                this.all.pop();
            }
        },
        danger(text) {
            this.post('danger', text);
        },
        warning(text) {
            this.post('warning', text);
        },
        success(text) {
            this.post('success', text);
        },
        info(text) {
            this.post('info', text);
        },
        close(id) {
            for (let i = this.all.length - 1; i >= 0; i--) {
                if (this.all[i].id === id) {
                    this.all.splice(i, 1);
                }
            }
        },
        handleErrorResponse(response) {
            let data = response.body;

            if (data) {
                if (response.status === 422 && data.errors) {
                    // validation response
                    for (let key in data.errors) {
                        this.danger(data.errors[key][0]);
                    }
                    return;
                } else if (data.message) {
                    // error response
                    this.danger(data.message);
                    return;
                } else if (typeof data === 'string') {
                    // unknown error response
                    this.danger(data);
                    return;
                }
            }

            if (response.status === 403) {
                this.danger("You have no permission to do that.");
            } else if (response.status === 401) {
                this.danger("Please log in (again).");
            } else {
                this.danger("The server didn't respond, sorry.");
            }
        },
        // I always mix this up...
        handleResponseError(response) {
            return this.handleErrorResponse(response);
        },
    },
});

export let handleErrorResponse = store.handleErrorResponse;

export default store;
</script>
