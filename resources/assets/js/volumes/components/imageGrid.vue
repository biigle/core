<template>
    <div class="image-grid" @wheel.prevent="scroll">
        <div class="image-grid__images" ref="images">
            <image-grid-image
                v-if="hasPinnedImage"
                :key="pinnedImageKey"
                :pinnable="pinnable"
                :image="pinnedImage"
                :is-pinned="true"
                :empty-url="emptyUrl"
                :selectable="selectable"
                :selected-icon="selectedIcon"
                :selected-fade="false"
                :small-icon="true"
                @select="emitSelect"
                @pin="emitPin"
                ></image-grid-image>
            <image-grid-image
                v-for="image in displayedImages"
                :key="image.id"
                :pinnable="pinnable"
                :image="image"
                :empty-url="emptyUrl"
                :selectable="selectable"
                :selected-icon="selectedIcon"
                @select="emitSelect"
                @pin="emitPin"
                ></image-grid-image>
        </div>
        <image-grid-progress
            v-if="canScroll"
            :progress="progress"
            @top="jumpToStart"
            @prev-page="reversePage"
            @prev-row="reverseRow"
            @jump="jumpToPercent"
            @next-row="advanceRow"
            @next-page="advancePage"
            @bottom="jumpToEnd"
            ></image-grid-progress>
    </div>
</template>

<script>
import Image from './imageGridImage.vue';
import Keyboard from '@/core/keyboard.js';
import Progress from './imageGridProgress.vue';

/**
 * A component that displays a grid of lots of images for Largo
 *
 * @type {Object}
 */
export default {
    emits: [
        'pin',
        'scroll',
        'select',
    ],
    data() {
        return {
            clientWidth: 0,
            clientHeight: 0,
            offset: 0,
            // The offset that updates the displayed images is set with a delay during
            // scrolling so scrolling feels faster.
            imagesOffset: 0,
            imagesOffsetTimeout: null,
        };
    },
    components: {
        imageGridImage: Image,
        imageGridProgress: Progress,
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
        pinnedImage: {
            type: Object,
            default: null,
        },
        pinnable: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        columns() {
            // This might be 0 if the clientWidth is not yet initialized, so force 1.
            // The double "margin" accounts for the CSS margin, padding and border.
            return Math.max(1, Math.floor(this.clientWidth / (this.width + 2 * this.margin)));
        },
        rows() {
            // This might be 0 if the clientHeight is not yet initialized, so force 1.
            // The double "margin" accounts for the CSS margin, padding and border.
            return Math.max(1, Math.floor(this.clientHeight / (this.height + 2 * this.margin)));
        },
        imagesOffsetEnd() {
            const offset = this.imagesOffset + this.columns * this.rows;
            // The pinned image is always shown as the first element so we have to show
            // one other image less on a page.
            if (this.hasPinnedImage) {
                return offset - 1;
            }

            return offset;
        },
        displayedImages() {
            return this.images.slice(this.imagesOffset, this.imagesOffsetEnd);
        },
        progress() {
            return this.offset / (this.columns * this.lastRow);
        },
        // Number of the topmost row of the last "page".
        lastRow() {
            // The pinned image is not included in this.images so we have to add 1 here.
            if (this.hasPinnedImage) {
                return Math.max(0, Math.ceil((this.images.length + 1) / this.columns) - this.rows);
            }

            return Math.max(0, Math.ceil(this.images.length / this.columns) - this.rows);
        },
        // The largest possible offset.
        lastOffset() {
            return this.lastRow * this.columns;
        },
        canScroll() {
            return this.lastRow > 0;
        },
        hasPinnedImage() {
            return this.pinnedImage !== null;
        },
        pinnedImageKey() {
            if (!this.hasPinnedImage) {
                return '';
            }

            return `r-${this.pinnedImage.id}`;
        }
    },
    methods: {
        updateDimensions() {
            if (this.$refs.images) {
                this.clientHeight = this.$refs.images.clientHeight;
                this.clientWidth = this.$refs.images.clientWidth;
            }
        },
        scrollRows(rows, debounce) {
            this.setOffset(this.offset + this.columns * rows, debounce);
        },
        scroll(e) {
            this.scrollRows((e.deltaY >= 0) ? 1 : -1, true);
        },
        advanceRow() {
            this.scrollRows(1);
        },
        advancePage() {
            this.scrollRows(this.rows);
        },
        reverseRow() {
            this.scrollRows(-1);
        },
        reversePage() {
            this.scrollRows(-this.rows);
        },
        jumpToPercent(percent) {
            // The percentage from 0 to 1 goes from row 0 to the topmost row
            // of the last "page" and *not* to the very last row.
            this.setOffset(this.columns * Math.round(this.lastRow * percent));
        },
        jumpToStart() {
            this.jumpToPercent(0);
        },
        jumpToEnd() {
            this.jumpToPercent(1);
        },
        emitSelect(image, event) {
            this.$emit('select', image, event);
        },
        setOffset(value, debounce) {
            this.offset = Math.max(0, Math.min(this.lastOffset, value));
            clearTimeout(this.imagesOffsetTimeout);
            if (debounce) {
                this.imagesOffsetTimeout = setTimeout(() => {
                    this.imagesOffset = this.offset;
                }, 25);
            } else {
                this.imagesOffset = this.offset;
            }
        },
        emitPin(id) {
            this.$emit('pin', id);
        },
    },
    watch: {
        lastOffset() {
            // Update the offset if the grid is scrolled to the very bottom.
            this.setOffset(this.offset);
        },
        offset() {
            this.$emit('scroll', this.offset);
        },
        pinnedImage() {
            this.jumpToStart();
        },
    },
    created() {
        Keyboard.on('ArrowUp', this.reverseRow, 0, this.listenerSet);
        Keyboard.on('w', this.reverseRow, 0, this.listenerSet);
        Keyboard.on('ArrowDown', this.advanceRow, 0, this.listenerSet);
        Keyboard.on('s', this.advanceRow, 0, this.listenerSet);
        Keyboard.on('ArrowLeft', this.reversePage, 0, this.listenerSet);
        Keyboard.on('a', this.reversePage, 0, this.listenerSet);
        Keyboard.on('ArrowRight', this.advancePage, 0, this.listenerSet);
        Keyboard.on('d', this.advancePage, 0, this.listenerSet);
        Keyboard.on('PageUp', this.reversePage, 0, this.listenerSet);
        Keyboard.on('PageDown', this.advancePage, 0, this.listenerSet);
        Keyboard.on('Home', this.jumpToStart, 0, this.listenerSet);
        Keyboard.on('End', this.jumpToEnd, 0, this.listenerSet);
        this.setOffset(this.initialOffset);
    },
    mounted() {
        // Only call updateDimensions when the element actually exists.
        window.addEventListener('resize', this.updateDimensions);
        this.$nextTick(this.updateDimensions);
        this.$watch('canScroll', this.updateDimensions);
    },
};
</script>
