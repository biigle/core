<template>
    <span class="tick" :style="style" v-text="text"></span>
</template>

<script>
import videoTime from '@/videos/filters/videoTime';

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
            return videoTime(this.time);
        },
    },
};
</script>
