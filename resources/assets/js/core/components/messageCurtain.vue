<template>
    <div class="message-curtain">
        <slot><span class="lead message-curtain--text" v-text="text"></span></slot>
    </div>
</template>

<script>
/**
 * A component for a "curtain" that covers/blocks the whole parent element.
 *
 * @type {Object}
 */
export default {
    props: {
        text: {
            type: String,
            default: '',
        },
    },
};
</script>
