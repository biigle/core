<template>
    <div class="current-time">
        <loader v-if="seeking" :active="true"></loader>
        <div ref="wrapper" class="current-time__wrapper">
            <canvas ref="canvas" v-show="!seeking"></canvas>
        </div>
    </div>
</template>

<script>
import Loader from '@/core/components/loader.vue';
import videoTime from '@/videos/filters/videoTime';

export default {
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        loader: Loader,
    },
    computed: {
        currentTimeText() {
            return videoTime(this.currentTime);
        },
    },
    methods: {
        updateText() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillText(this.currentTimeText, this.textX, this.textY);
        },
    },
    watch: {
        currentTimeText() {
            this.updateText();
        },
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        const dpr = window.devicePixelRatio;
        this.canvas.width = this.$refs.wrapper.clientWidth * dpr;
        this.canvas.height = this.$refs.wrapper.clientHeight * dpr;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        this.ctx.font = window.getComputedStyle(this.$el, null).getPropertyValue('font');
        this.ctx.fillStyle = window.getComputedStyle(this.$el, null).getPropertyValue('color');
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.textX = this.canvas.width / dpr / 2;
        this.textY = this.canvas.height / dpr / 2 + 1;
        this.updateText();
    },
};
</script>
