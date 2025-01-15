<template>
<div
    class="messages__message alert"
    :class="typeClass"
    @mouseenter="cancelTimeout"
    >
    <a @click="close" href="#" class="close">&times;</a>
    <span v-text="text"></span>
</div>
</template>
<script>
export default {
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
</script>
