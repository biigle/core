<template>
    <span class="tick" :style="style" v-text="text"></span>
</template>

<script>
export default {
    props: {
        time: {
            type: Number,
            required: true,
        },
    },
    computed: {
        style() {
            let offset = this.time / this.$parent.duration * this.$parent.elementWidth;

            return `left: ${offset}px`;
        },
        text() {
            return Vue.filter('videoTime')(this.time);
        },
    },
};
</script>
