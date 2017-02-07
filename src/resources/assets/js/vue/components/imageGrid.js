/**
 * A component that displays a grid of lots of images for Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.imageGrid', {
    template: '<div class="image-grid">' +
        '<div class="image-grid__images" ref="images">' +
            '<image-grid-image v-for="image in displayedImages" :key="image.id" :image="image" :empty-url="emptyUrl" @select="emitSelect" @deselect="emitDeselect"></image-grid-image>' +
        '</div>' +
        '<image-grid-progress :progress="progress" @top="jumpToStart" @prev-page="reversePage" @prev-row="reverseRow" @jump="jumpToPercent" @next-row="advanceRow" @next-page="advancePage" @bottom="jumpToEnd"></image-grid-progress>' +
    '</div>',
    data: function () {
        return {
            clientWidth: 0,
            clientHeight: 0,
            privateOffset: 0,
        };
    },
    components: {
        imageGridImage: biigle.$require('largo.components.imageGridImage'),
        imageGridProgress: biigle.$require('largo.components.imageGridProgress'),
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
    },
    computed: {
        columns: function () {
            return Math.floor(this.clientWidth / (this.width + this.margin));
        },
        rows: function () {
            return Math.floor(this.clientHeight / (this.height + this.margin));
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
        // number of the topmost row of the last "page"
        lastRow: function () {
            return Math.ceil(this.images.length / this.columns) - this.rows;
        },
    },
    methods: {
        updateDimensions: function () {
            this.clientHeight = this.$refs.images.clientHeight;
            this.clientWidth = this.$refs.images.clientWidth;
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
            // the percentage from 0 to 1 goes from row 0 to the topmost row
            // of the last "page" and *not* to the very last row
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
    created: function () {
        window.addEventListener('resize', this.updateDimensions);
    },
    mounted: function () {
        this.$nextTick(this.updateDimensions);
        this.$el.addEventListener('wheel', this.scroll);
    },
});
