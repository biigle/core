<template>
    <div class="image-grid-progress">
        <div class="btn-group-vertical">
            <button type="button" class="btn btn-default btn-xs" title="Go to top 𝗛𝗼𝗺𝗲" @click="top" :disabled="isAtTop">
                <span class="fa fa-fast-backward fa-rotate-90"></span>
            </button>
            <button type="button" class="btn btn-default btn-xs" title="Previous page 𝗣𝗮𝗴𝗲 𝘂𝗽/𝗔𝗿𝗿𝗼𝘄 𝗹𝗲𝗳𝘁" @click="prevPage" :disabled="isAtTop">
                <span class="fa fa-step-backward fa-rotate-90"></span>
            </button>
            <button type="button" class="btn btn-default btn-xs" title="Previous row 𝗔𝗿𝗿𝗼𝘄 𝘂𝗽" @click="prevRow" :disabled="isAtTop">
                <span class="fa fa-chevron-up"></span>
            </button>
        </div>
        <div class="image-grid-progress__bar" @mousedown="beginScrolling" @mouseup="stopScrolling" @mouseleave="stopScrolling" @mousemove.prevent="scroll" @click="jump">
            <div class="image-grid-progress__wrapper">
                <div class="image-grid-progress__inner" :style="{height: progressHeight}"></div>
            </div>
        </div>
        <div class="btn-group-vertical">
            <button type="button" class="btn btn-default btn-xs" title="Next row 𝗔𝗿𝗿𝗼𝘄 𝗱𝗼𝘄𝗻" @click="nextRow" :disabled="isAtBottom">
                <span class="fa fa-chevron-down"></span>
            </button>
            <button type="button" class="btn btn-default btn-xs" title="Next page 𝗣𝗮𝗴𝗲 𝗱𝗼𝘄𝗻/𝗔𝗿𝗿𝗼𝘄 𝗿𝗶𝗴𝗵𝘁" @click="nextPage" :disabled="isAtBottom">
                <span class="fa fa-step-forward fa-rotate-90"></span>
            </button>
            <button type="button" class="btn btn-default btn-xs" title="Go to bottom 𝗘𝗻𝗱" @click="bottom" :disabled="isAtBottom">
                <span class="fa fa-fast-forward fa-rotate-90"></span>
            </button>
        </div>
    </div>
</template>

<script>
/**
 * The progress bar of the Largo image grid
 *
 * @type {Object}
 */
export default {
    emits: [
        'bottom',
        'jump',
        'next-page',
        'next-row',
        'prev-page',
        'prev-row',
        'top',
    ],
    data() {
        return {
            scrolling: false,
        };
    },
    props: {
        progress: {
            type: Number,
            required: true,
        },
    },
    computed: {
        isAtTop() {
            return this.progress === 0;
        },
        isAtBottom() {
            return this.progress === 1;
        },
        progressHeight() {
            return (this.progress * 100) + '%';
        },
    },
    methods: {
        top() {
            this.$emit('top');
        },
        prevPage() {
            this.$emit('prev-page');
        },
        prevRow() {
            this.$emit('prev-row');
        },
        beginScrolling() {
            this.scrolling = true;
        },
        stopScrolling() {
            this.scrolling = false;
        },
        scroll(e) {
            if (!this.scrolling) return;
            this.jump(e);
        },
        jump(e) {
            let rect = e.target.getBoundingClientRect();
            this.$emit('jump', (e.clientY - rect.top) / rect.height);
        },
        nextRow() {
            this.$emit('next-row');
        },
        nextPage() {
            this.$emit('next-page');
        },
        bottom() {
            this.$emit('bottom');
        },
    },
};
</script>
