<template>
    <div
        class="scroll-strip"
        @wheel.stop="handleWheel"
        @mouseleave="handleHideHoverTime"
        >
            <div
                class="scroll-strip__scroller"
                ref="scroller"
                :style="scrollerStyle"
                @mousemove="handleUpdateHoverTime"
                >
                    <thumbnail-preview
                        :duration="duration"
                        :hoverTime="hoverTime"
                        :clientMouseX="clientMouseX"
                        :scrollstripTop="scrollstripTop"
                        :videoId="videoId"
                        :showThumbnails="showThumbnailPreview"
                        v-if="finishedInitalizingData"
                        v-show="canShowThumb"
                        ></thumbnail-preview>
                    <video-progress
                        :duration="duration"
                        :element-width="elementWidth"
                        @seek="emitSeek"
                        @mousemove="handleVideoProgressMousemove"
                        @mouseout="hideThumbnailPreview"
                        ></video-progress>
                    <div class="annotation-tracks-wrapper">
                        <annotation-tracks
                            ref="annotationTracks"
                            :tracks="tracks"
                            :duration="duration"
                            :element-width="elementWidth"
                            @select="emitSelect"
                            @deselect="emitDeselect"
                            @scroll-y="emitScrollY"
                            @drag-x="handleDragX"
                            @overflow-top="updateOverflowTop"
                            @overflow-bottom="updateOverflowBottom"
                            ></annotation-tracks>
                        <div class="overflow-shadow overflow-shadow--top" v-show="hasOverflowTop"></div>
                        <div class="overflow-shadow overflow-shadow--bottom" v-show="hasOverflowBottom"></div>
                    </div>
                    <span
                        class="time-indicator"
                        :class="timeIndicatorClass"
                        :style="timeIndicatorStyle"
                        ></span>
                    <span
                        class="hover-time-indicator"
                        :style="hoverTimeIndicatorStyle"
                        v-show="showHoverTime"
                        ></span>
            </div>
            <div class="overflow-shadow overflow-shadow--left" v-show="hasOverflowLeft"></div>
            <div class="overflow-shadow overflow-shadow--right" v-show="hasOverflowRight"></div>
    </div>
</template>

<script>
import AnnotationTracks from './annotationTracks.vue';
import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.js';
import VideoProgress from './videoProgress.vue';
import ThumbnailPreview from './thumbnailPreview.vue';

export default {
    emits: [
        'deselect',
        'hover-time',
        'scroll-y',
        'seek',
        'select',
    ],
    components: {
        videoProgress: VideoProgress,
        annotationTracks: AnnotationTracks,
        thumbnailPreview: ThumbnailPreview,
    },
    props: {
        tracks: {
            type: Array,
            required() {
                return [];
            },
        },
        duration: {
            type: Number,
            required: true,
        },
        currentTime: {
            type: Number,
            required: true,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
        showThumbnailPreview: {
            type: Boolean,
            default: true
        },
        videoId: {
            type: Number,
            required: true
        },
        hasError: {
            type: Boolean,
            default: false
        },
    },
    data() {
        return {
            zoom: 1,
            // Zoom amount to add/substract per vertical scroll event.
            zoomFactor: 0.3,
            // Number of pixels to move the scroller left/right per horizontal scroll
            // event.
            scrollFactor: 10,
            initialElementWidth: 0,
            scrollLeft: 0,
            hoverTime: 0,
            hasOverflowTop: false,
            hasOverflowBottom: false,
            // thumbnail preview
            clientMouseX: 0,
            scrollstripTop: 0,
            canShowThumb: false,
        };
    },
    computed: {
        currentTimePosition() {
            if (this.duration > 0) {
                return this.elementWidth * this.currentTime / this.duration;
            }

            return 0;
        },
        timeIndicatorClass() {
            return {
                'time-indicator--seeking': this.seeking,
            };
        },
        timeIndicatorStyle() {
            return `transform: translateX(${this.currentTimePosition}px);`;
        },
        hoverTimeIndicatorStyle() {
            return `transform: translateX(${this.hoverPosition}px);`;
        },
        scrollerStyle() {
            return {
                width: (this.zoom * 100) + '%',
                left: this.scrollLeft + 'px',
            };
        },
        elementWidth() {
            return this.initialElementWidth * this.zoom;
        },
        hoverPosition() {
            if (this.duration > 0) {
                return this.elementWidth * this.hoverTime / this.duration;
            }

            return 0;
        },
        showHoverTime() {
            return this.hoverTime !== 0;
        },
        hasOverflowLeft() {
            return this.scrollLeft < 0;
        },
        hasOverflowRight() {
            return this.elementWidth + this.scrollLeft > this.initialElementWidth;
        },
        finishedInitalizingData() {
            return !this.hasError && this.duration > 0;
        },
    },
    methods: {
        updateInitialElementWidth() {
            this.initialElementWidth = this.$el.clientWidth;
        },
        emitSeek(time) {
            this.$emit('seek', time);
        },
        emitSelect(annotation, time, shift) {
            this.$emit('select', annotation, time, shift);
        },
        emitDeselect(annotation) {
            this.$emit('deselect', annotation);
        },
        emitScrollY(scrollTop) {
            this.$emit('scroll-y', scrollTop);
        },
        handleWheel(e) {
            if (e.shiftKey) {
                if (e.deltaY !== 0) {
                    this.updateZoom(e);
                }
            } else {
                if (e.deltaX < 0) {
                    this.updateScrollLeft(this.scrollLeft + this.scrollFactor);
                } else if (e.deltaX > 0) {
                    this.updateScrollLeft(this.scrollLeft - this.scrollFactor);
                }
            }
        },
        updateZoom(e) {
            let xRel = e.clientX - this.$el.getBoundingClientRect().left;
            let xAbs = e.clientX - this.$refs.scroller.getBoundingClientRect().left;
            let xPercent = xAbs / this.elementWidth;

            let factor = e.deltaY < 0 ? this.zoomFactor : -1 * this.zoomFactor;
            this.zoom = Math.max(1, this.zoom + factor);

            this.$nextTick(() => {
                let newXAbs = xPercent * this.elementWidth;
                // Update scroll position so the cursor position stays fixed while
                // zooming.
                this.updateScrollLeft(xRel - newXAbs);
            });
        },
        handleHideHoverTime() {
            this.hoverTime = 0;
        },
        handleUpdateHoverTime(e) {
            this.hoverTime = (e.clientX - this.$refs.scroller.getBoundingClientRect().left) / this.elementWidth * this.duration;
        },
        updateScrollLeft(value) {
            this.scrollLeft = Math.max(Math.min(0, value), this.initialElementWidth - this.elementWidth);
        },
        updateOverflowTop(has) {
            this.hasOverflowTop = has;
        },
        updateOverflowBottom(has) {
            this.hasOverflowBottom = has;
        },
        handleDragX(delta) {
            this.updateScrollLeft(this.scrollLeft + delta);
        },
        updateHeight() {
            this.$refs.annotationTracks.updateClientHeight();
        },
        reset() {
            this.zoom = 1;
            this.scrollLeft = 0;
            this.hoverTime = 0;
            this.hasOverflowTop = false;
            this.hasOverflowBottom = false;
        },
        handleVideoProgressMousemove(clientX) {
            this.canShowThumb = true;
            this.clientMouseX = clientX;
            this.scrollstripTop = this.$refs.scroller.getBoundingClientRect().top;
        },
        hideThumbnailPreview() {
            this.canShowThumb = false;
        },
    },
    watch: {
        hoverTime(time) {
          this.$emit('hover-time', time);
        },
        initialElementWidth(newWidth, oldWidth) {
            // Make sure the left position stays the same if the browser resizes or the
            // sidebar open state is toggled.
            this.updateScrollLeft(this.scrollLeft * newWidth / oldWidth);
        },
    },
    created() {
        window.addEventListener('resize', this.updateInitialElementWidth);
        Events.on('sidebar.toggle', () => {
            this.$nextTick(this.updateInitialElementWidth);
        });

        // Do not scroll down when the Spacebar is pressed.
        Keyboard.on(' ', function (e) {
            e.preventDefault();
        });
    },
    mounted() {
        this.$nextTick(this.updateInitialElementWidth);
    },
};
</script>
