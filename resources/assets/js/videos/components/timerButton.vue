<template>
    <span
        class="control-button btn"
        :title="title"
        :disabled="disabled || null"
        @click="handleClick"
        >
        <svg class="timer-svg" viewBox="0 0 2 2">
            <circle v-cloak v-if="progress==1" cx="1" cy="1" r="1"></circle>
            <path v-else transform="rotate(-90, 1, 1)" :d="progressPath"></path>
        </svg>
    </span>
</template>

<script>
import {progressPath} from '@/annotations/components/breadcrumb.vue';

export default {
    emits: [
        'click',
    ],
    props: {
        timeout: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            startTime: 0,
            progress: 0,
        };
    },
    computed: {
        progressPath() {
            return progressPath(this.progress);
        },
    },
    methods: {
        handleClick() {
            if (!this.disabled) {
                this.$emit('click');
            }
        },
        updateProgress() {
            this.progress = 1 - Math.min((Date.now() - this.startTime) / this.timeout, 1);
            if (this.progress > 0) {
                window.requestAnimationFrame(this.updateProgress.bind(this));
            }
        },
    },
    created() {
        this.startTime = Date.now();
        this.updateProgress();
    },
};
</script>

<style scoped>
@keyframes pulse {
  50% {
    transform: scale(2);
  }
  100% {
    transform: scale(1);
  }
}

.timer-svg {
    display: inline-block;
    vertical-align: middle;
    width: 14px;
    height: 14px;
    animation: .5s ease-out pulse;
}

.timer-svg path, .timer-svg circle {
    fill: white;
}
</style>
