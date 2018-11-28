/**
 * A component that displays a grid of lots of images for Largo
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageGrid', {
    template: '<div class="image-grid" @wheel.prevent="scroll">' +
        '<div class="image-grid__images" ref="images">' +
            '<image-grid-image v-for="image in displayedImages" :key="image.id" :image="image" :empty-url="emptyUrl" :selectable="selectable" :selected-icon="selectedIcon" @select="emitSelect"></image-grid-image>' +
        '</div>' +
        '<image-grid-progress v-if="canScroll" :progress="progress" @top="jumpToStart" @prev-page="reversePage" @prev-row="reverseRow" @jump="jumpToPercent" @next-row="advanceRow" @next-page="advancePage" @bottom="jumpToEnd"></image-grid-progress>' +
    '</div>',
    data: function () {
        return {
            clientWidth: 0,
            clientHeight: 0,
            offset: 0,
        };
    },
    components: {
        imageGridImage: biigle.$require('volumes.components.imageGridImage'),
        imageGridProgress: biigle.$require('volumes.components.imageGridProgress'),
    },
    props: {
        images: {
            type: Array,
            required: true,
        },
        emptyUrl: {
            type: String,
            required: true,
        },
        width: {
            type: Number,
            default: 135,
        },
        height: {
            type: Number,
            default: 180,
        },
        margin: {
            type: Number,
            default: 8,
        },
        initialOffset: {
            type: Number,
            default: 0,
        },
        selectable: {
            type: Boolean,
            default: false,
        },
        selectedIcon: {
            type: String,
            default: 'check',
        },
        // Keyboard event listener set to use (in case there are other components using
        // the same shortcut keys on the same page).
        listenerSet: {
            type: String,
            default: 'default',
        },
    },
    computed: {
        columns: function () {
            // This might be 0 if the clientWidth is not yet initialized, so force 1.
            return Math.max(1, Math.floor(this.clientWidth / (this.width + this.margin)));
        },
        rows: function () {
            // This might be 0 if the clientHeight is not yet initialized, so force 1.
            return Math.max(1, Math.floor(this.clientHeight / (this.height + this.margin)));
        },
        displayedImages: function () {
            return this.images.slice(this.offset, this.offsetEnd);
        },
        offsetEnd: function () {
            return this.offset + this.columns * this.rows;
        },
        progress: function () {
            return this.offset / (this.columns * this.lastRow);
        },
        // Number of the topmost row of the last "page".
        lastRow: function () {
            return Math.max(0, Math.ceil(this.images.length / this.columns) - this.rows);
        },
        // The largest possible offset.
        lastOffset: function () {
            return this.lastRow * this.columns;
        },
        canScroll: function () {
            return this.lastRow > 0;
        },
    },
    methods: {
        updateDimensions: function () {
            if (this.$refs.images) {
                this.clientHeight = this.$refs.images.clientHeight;
                this.clientWidth = this.$refs.images.clientWidth;
            }
        },
        scrollRows: function (rows) {
            this.setOffset(this.offset + this.columns * rows);
        },
        scroll: function (e) {
            this.scrollRows((e.deltaY >= 0) ? 1 : -1);
        },
        advanceRow: function () {
            this.scrollRows(1);
        },
        advancePage: function () {
            this.scrollRows(this.rows);
        },
        reverseRow: function () {
            this.scrollRows(-1);
        },
        reversePage: function () {
            this.scrollRows(-this.rows);
        },
        jumpToPercent: function (percent) {
            // The percentage from 0 to 1 goes from row 0 to the topmost row
            // of the last "page" and *not* to the very last row.
            this.setOffset(this.columns * Math.round(this.lastRow * percent));
        },
        jumpToStart: function () {
            this.jumpToPercent(0);
        },
        jumpToEnd: function () {
            this.jumpToPercent(1);
        },
        emitSelect: function (image, event) {
            this.$emit('select', image, event);
        },
        setOffset: function (value) {
            this.offset = Math.max(0, Math.min(this.lastOffset, value));
        },
    },
    watch: {
        lastOffset: function () {
            // Update the offset if the grid is scrolled to the very bottom.
            this.setOffset(this.offset);
        },
        offset: function () {
            this.$emit('scroll', this.offset);
        },
    },
    created: function () {
        var keyboard = biigle.$require('keyboard');
        keyboard.on('ArrowUp', this.reverseRow, 0, this.listenerSet);
        keyboard.on('w', this.reverseRow, 0, this.listenerSet);
        keyboard.on('ArrowDown', this.advanceRow, 0, this.listenerSet);
        keyboard.on('s', this.advanceRow, 0, this.listenerSet);
        keyboard.on('ArrowLeft', this.reversePage, 0, this.listenerSet);
        keyboard.on('a', this.reversePage, 0, this.listenerSet);
        keyboard.on('ArrowRight', this.advancePage, 0, this.listenerSet);
        keyboard.on('d', this.advancePage, 0, this.listenerSet);
        keyboard.on('PageUp', this.reversePage, 0, this.listenerSet);
        keyboard.on('PageDown', this.advancePage, 0, this.listenerSet);
        keyboard.on('Home', this.jumpToStart, 0, this.listenerSet);
        keyboard.on('End', this.jumpToEnd, 0, this.listenerSet);
        this.setOffset(this.initialOffset);
    },
    mounted: function () {
        // Only call updateDimensions when the element actually exists.
        window.addEventListener('resize', this.updateDimensions);
        this.$on('resize', this.updateDimensions);
        this.$nextTick(this.updateDimensions);
        this.$watch('canScroll', this.updateDimensions);
    },
});
