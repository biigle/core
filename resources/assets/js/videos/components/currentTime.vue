<template>
    <div class="current-time">
        <loader :active="seeking"></loader>
        <img
            class="current-time__mediabunny"
            :class="{'current-time__mediabunny--active': mediabunnyDecoding}"
            :src="mediabunnyLogo"
        >
        <div ref="wrapper" class="current-time__wrapper" v-show="!seeking && !mediabunnyDecoding">
            <canvas ref="canvas"></canvas>
        </div>
    </div>
</template>

<script>
import Loader from '@/core/components/loader.vue';
import videoTime from '@/videos/filters/videoTime';
import mediabunnyLogo from '@images/mediabunny-logo.svg';

export default {
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        mediabunnyDecoding: {
            type: Boolean,
            default: false,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            mediabunnyLogo,
        };
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
