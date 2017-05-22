/**
 * A component that displays a grid of lots of images for Largo
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageGrid', {
    template: '<div class="image-grid" @wheel.prevent="scroll">' +
        '<div class="image-grid__images" ref="images">' +
            '<image-grid-image v-for="image in displayedImages" :key="image.id" :image="image" :empty-url="emptyUrl" @select="emitSelect" @deselect="emitDeselect"></image-grid-image>' +
        '</div>' +
        '<image-grid-progress v-if="canScroll" :progress="progress" @top="jumpToStart" @prev-page="reversePage" @prev-row="reverseRow" @jump="jumpToPercent" @next-row="advanceRow" @next-page="advancePage" @bottom="jumpToEnd"></image-grid-progress>' +
    '</div>',
    data: function () {
        return {
            clientWidth: 0,
            clientHeight: 0,
            privateOffset: 0,
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
            return this.images.slice(this.offset, this.offset + this.columns * this.rows);
        },
        offset: {
            get: function () {
                return this.privateOffset;
            },
            set: function (value) {
                this.privateOffset = Math.max(0, Math.min(this.lastRow * this.columns, value));
            },
        },
        progress: function () {
            return this.offset / (this.columns * this.lastRow);
        },
        // Number of the topmost row of the last "page".
        lastRow: function () {
            return Math.max(0, Math.ceil(this.images.length / this.columns) - this.rows);
        },
        canScroll: function () {
            return this.lastRow > 0;
        },
    },
    methods: {
        updateDimensions: function () {
            this.clientHeight = this.$refs.images.clientHeight;
            this.clientWidth = this.$refs.images.clientWidth;
            // Update the offset if the grid is scrolled to the very bottom
            // (this.lastRow may have changed).
            this.offset = this.offset;
        },
        scrollRows: function (rows) {
            this.offset = this.offset + this.columns * rows;
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
            this.offset = this.columns * Math.round(this.lastRow * percent);
        },
        jumpToStart: function () {
            this.jumpToPercent(0);
        },
        jumpToEnd: function () {
            this.jumpToPercent(1);
        },
        emitSelect: function (image) {
            this.$emit('select', image);
        },
        emitDeselect: function (image) {
            this.$emit('deselect', image);
        },
    },
    watch: {
        images: function () {
            // Update the offset if the grid is scrolled to the very bottom
            // (this.lastRow may have changed).
            this.offset = this.offset;
        },
        offset: function () {
            this.$emit('scroll', this.offset);
        },
    },
    created: function () {
        var keyboard = biigle.$require('keyboard');
        // arrow up
        keyboard.on(38, this.reverseRow);
        // arrow down
        keyboard.on(40, this.advanceRow);
        // arrow left
        keyboard.on(37, this.reversePage);
        // page up
        keyboard.on(33, this.reversePage);
        // arrow right
        keyboard.on(39, this.advancePage);
        // page down
        keyboard.on(34, this.advancePage);
        // home
        keyboard.on(36, this.jumpToStart);
        // end
        keyboard.on(35, this.jumpToEnd);

        this.offset = this.initialOffset;
    },
    mounted: function () {
        // Only call updateDimensions when the element actually exists.
        window.addEventListener('resize', this.updateDimensions);
        this.$on('resize', this.updateDimensions);
        this.$nextTick(this.updateDimensions);
        this.$watch('canScroll', this.updateDimensions);
    },
});
