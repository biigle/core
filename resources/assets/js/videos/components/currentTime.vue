<template>
    <div
        class="current-time"
        :class="classObject"
        >
            <loader v-show="seeking" :active="seeking"></loader>
            <span v-show="!seeking">
                <canvas ref="canvas" class="current-time-canvas"></canvas>
                <!-- <span
                    v-text="currentTimeText"
                    ></span>
                <span
                    class="hover-time"
                    v-show="showHoverTime"
                    v-text="hoverTimeText"
                    ></span> -->
            </span>
    </div>
</template>

<script>
import Loader from '../../core/components/loader';

export default {
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        hoverTime: {
            type: Number,
            default: 0,
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
            return Vue.filter('videoTime')(this.currentTime);
        },
        hoverTimeText() {
            return Vue.filter('videoTime')(this.hoverTime);
        },
        classObject() {
            return {
                'current-time--seeking': this.seeking,
                'current-time--hover': this.showHoverTime,
            };
        },
        showHoverTime() {
            return this.hoverTime !== 0;
        },
    },
    watch: {
        currentTimeText(text) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillText(text, 0, this.$el.offsetHeight);
        },
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.canvas.width = this.$el.offsetWidth;
        this.canvas.height = this.$el.offsetHeight;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = "#ff0000";
    },
};
</script>
