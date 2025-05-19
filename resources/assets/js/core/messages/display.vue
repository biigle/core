<script>
import Message from './message.vue';
import Store from './store.js';

/**
 * The popup message display.
 *
 * Shows and handles closing of new popup messages.
 */
export default {
    components: {
        message: Message,
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
