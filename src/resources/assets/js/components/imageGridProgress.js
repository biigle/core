/**
 * The progress bar of the Largo image grid
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageGridProgress', {
    template: '<div class="image-grid-progress">' +
        '<div class="btn-group-vertical">' +
            '<button type="button" class="btn btn-default btn-xs" title="Go to top 𝗛𝗼𝗺𝗲" @click="top" :disabled="isAtTop">' +
                '<span class="fa fa-fast-backward fa-rotate-90"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-default btn-xs" title="Previous page 𝗣𝗮𝗴𝗲 𝘂𝗽/𝗔𝗿𝗿𝗼𝘄 𝗹𝗲𝗳𝘁" @click="prevPage" :disabled="isAtTop">' +
                '<span class="fa fa-step-backward fa-rotate-90"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-default btn-xs" title="Previous row 𝗔𝗿𝗿𝗼𝘄 𝘂𝗽" @click="prevRow" :disabled="isAtTop">' +
                '<span class="fa fa-chevron-up"></span>' +
            '</button>' +
        '</div>' +
        '<div class="image-grid-progress__bar" @mousedown="beginScrolling" @mouseup="stopScrolling" @mouseleave="stopScrolling" @mousemove.prevent="scroll" @click="jump">' +
            '<div class="image-grid-progress__wrapper">' +
                '<div class="image-grid-progress__inner" :style="{height: progressHeight}"></div>' +
            '</div>' +
        '</div>' +
        '<div class="btn-group-vertical">' +
            '<button type="button" class="btn btn-default btn-xs" title="Next row 𝗔𝗿𝗿𝗼𝘄 𝗱𝗼𝘄𝗻" @click="nextRow" :disabled="isAtBottom">' +
                '<span class="fa fa-chevron-down"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-default btn-xs" title="Next page 𝗣𝗮𝗴𝗲 𝗱𝗼𝘄𝗻/𝗔𝗿𝗿𝗼𝘄 𝗿𝗶𝗴𝗵𝘁" @click="nextPage" :disabled="isAtBottom">' +
                '<span class="fa fa-step-forward fa-rotate-90"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-default btn-xs" title="Go to bottom 𝗘𝗻𝗱" @click="bottom" :disabled="isAtBottom">' +
                '<span class="fa fa-fast-forward fa-rotate-90"></span>' +
            '</button>' +
        '</div>' +
    '</div>',
    data: function () {
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
        isAtTop: function () {
            return this.progress === 0;
        },
        isAtBottom: function () {
            return this.progress === 1;
        },
        progressHeight: function () {
            return (this.progress * 100) + '%';
        },
    },
    methods: {
        top: function () {
            this.$emit('top');
        },
        prevPage: function () {
            this.$emit('prev-page');
        },
        prevRow: function () {
            this.$emit('prev-row');
        },
        beginScrolling: function () {
            this.scrolling = true;
        },
        stopScrolling: function () {
            this.scrolling = false;
        },
        scroll: function (e) {
            if (!this.scrolling) return;
            this.jump(e);
        },
        jump: function (e) {
            var rect = e.target.getBoundingClientRect();
            this.$emit('jump', (e.clientY - rect.top) / rect.height);
        },
        nextRow: function () {
            this.$emit('next-row');
        },
        nextPage: function () {
            this.$emit('next-page');
        },
        bottom: function () {
            this.$emit('bottom');
        },
    },
});
