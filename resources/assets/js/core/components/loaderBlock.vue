<template>
    <message-curtain :class="classObject">
        <loader :active="active" :fancy="true"></loader>
    </message-curtain>
</template>

<script>
import Loader from './loader.vue';
import MessageCurtain from './messageCurtain.vue';

/**
 * A component for a loading spinner element that acts as blocking overlay
 *
 * @type {Object}
 */
export default {
    components: {
        loader: Loader,
        messageCurtain: MessageCurtain,
    },
    props: {
        active: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        classObject() {
            return {
                'loader-block--inactive': !this.active,
            };
        },
    },
};
</script>
