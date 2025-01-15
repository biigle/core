<script>
import Store from './store.js';

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
        typeClass() {
            return `alert-${this.type}`;
        },
    },
    methods: {
        close() {
            Store.close(this.id);
        },
        cancelTimeout() {
            if (this.closeTimeoutId) {
                window.clearTimeout(this.closeTimeoutId);
                this.closeTimeoutId = null;
            }
        },
    },
    mounted() {
        if (this.type !== 'danger') {
            this.closeTimeoutId = window.setTimeout(this.close, 15000);
        }
    },
};

/**
 * The popup message display.
 *
 * Shows and handles closing of new popup messages.
 */
export default {
    components: {
        message: message,
    },
    data() {
        return {
            messages: Store.all,
        };
    },
    mounted() {
        let message = biigle.$require('staticMessage');
        if (message.text && message.type) {
            // Wait for nextTick so the message animation works.
            this.$nextTick(function () {
                Store.post(message.type, message.text);
            });
        }
    },
};
</script>
