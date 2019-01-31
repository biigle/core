biigle.$component('videos.components.scrollStrip', {
    template:
    '<div' +
        ' class="scroll-strip"' +
        ' @wheel.stop="handleWheel"' +
        ' @mouseleave="handleHideHoverTime"' +
        '>' +
            '<div' +
                ' class="scroll-strip__scroller"' +
                ' ref="scroller"' +
                ' :style="scrollerStyle"' +
                ' @mousemove="handleUpdateHoverTime"' +
                '>' +
                    '<video-progress' +
                        ' :bookmarks="bookmarks"' +
                        ' :duration="duration"' +
                        ' :element-width="elementWidth"' +
                        ' @seek="emitSeek"' +
                        '></video-progress>' +
                    '<annotation-tracks' +
                        ' :tracks="tracks"' +
                        ' :duration="duration"' +
                        ' :element-width="elementWidth"' +
                        ' @select="emitSelect"' +
                        ' @deselect="emitDeselect"' +
                        ' @scroll-y="emitScrollY"' +
                        ' @overflow-top="updateOverflowTop"' +
                        ' @overflow-bottom="updateOverflowBottom"' +
                        '></annotation-tracks>' +
                    '<span' +
                        ' class="time-indicator"' +
                        ' :class="timeIndicatorClass"' +
                        ' :style="timeIndicatorStyle"' +
                        '></span>' +
                    '<span' +
                        ' class="hover-time-indicator"' +
                        ' :style="hoverTimeIndicatorStyle"' +
                        ' v-show="showHoverTime"' +
                        '></span>' +
            '</div>' +
            '<div class="overflow-shadow overflow-shadow--top" v-show="hasOverflowTop"></div>' +
            '<div class="overflow-shadow overflow-shadow--bottom" v-show="hasOverflowBottom"></div>' +
            '<div class="overflow-shadow overflow-shadow--left" v-show="hasOverflowLeft"></div>' +
            '<div class="overflow-shadow overflow-shadow--right" v-show="hasOverflowRight"></div>' +
    '</div>',
    components: {
        videoProgress: biigle.$require('videos.components.videoProgress'),
        annotationTracks: biigle.$require('videos.components.annotationTracks'),
    },
    props: {
        tracks: {
            type: Array,
            required: function () {
                return [];
            },
        },
        bookmarks: {
            type: Array,
            required: function () {
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
    },
    data: function () {
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
        };
    },
    computed: {
        currentTimePosition: function () {
            if (this.duration > 0) {
                return this.elementWidth * this.currentTime / this.duration;
            }

            return 0;
        },
        timeIndicatorClass: function () {
            return {
                'time-indicator--seeking': this.seeking,
            };
        },
        timeIndicatorStyle: function () {
            return 'transform: translateX(' + this.currentTimePosition + 'px);';
        },
        hoverTimeIndicatorStyle: function () {
            return 'transform: translateX(' + this.hoverPosition + 'px);';
        },
        scrollerStyle: function () {
            return {
                width: (this.zoom * 100) + '%',
                left: this.scrollLeft + 'px',
            };
        },
        elementWidth: function () {
            return this.initialElementWidth * this.zoom;
        },
        hoverPosition: function () {
            if (this.duration > 0) {
                return this.elementWidth * this.hoverTime / this.duration;
            }

            return 0;
        },
        showHoverTime: function () {
            return this.hoverTime !== 0;
        },
        hasOverflowLeft: function () {
            return this.scrollLeft < 0;
        },
        hasOverflowRight: function () {
            return this.elementWidth + this.scrollLeft > this.initialElementWidth;
        },
    },
    methods: {
        updateInitialElementWidth: function () {
            this.initialElementWidth = this.$el.clientWidth;
        },
        emitSeek: function (time) {
            this.$emit('seek', time);
        },
        emitSelect: function (annotation, time) {
            this.$emit('select', annotation, time);
        },
        emitDeselect: function () {
            this.$emit('deselect');
        },
        emitScrollY: function (scrollTop) {
            this.$emit('scroll-y', scrollTop);
        },
        handleWheel: function (e) {
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
        updateZoom: function (e) {
            var xRel = e.clientX - this.$el.getBoundingClientRect().left;
            var xAbs = e.clientX - this.$refs.scroller.getBoundingClientRect().left;
            var xPercent = xAbs / this.elementWidth;

            var factor = e.deltaY < 0 ? this.zoomFactor : -1 * this.zoomFactor;
            this.zoom = Math.max(1, this.zoom + factor);

            this.$nextTick(function () {
                var newXAbs = xPercent * this.elementWidth;
                // Update scroll position so the cursor position stays fixed while
                // zooming.
                this.updateScrollLeft(xRel - newXAbs);
            });
        },
        handleHideHoverTime: function () {
            this.hoverTime = 0;
        },
        handleUpdateHoverTime: function (e) {
            this.hoverTime = (e.clientX - this.$refs.scroller.getBoundingClientRect().left) / this.elementWidth * this.duration;
        },
        updateScrollLeft: function (value) {
            this.scrollLeft = Math.max(Math.min(0, value), this.initialElementWidth - this.elementWidth);
        },
        updateOverflowTop: function (has) {
            this.hasOverflowTop = has;
        },
        updateOverflowBottom: function (has) {
            this.hasOverflowBottom = has;
        },
    },
    watch: {
        hoverTime: function (time) {
          this.$emit('hover-time', time);
        },
        initialElementWidth: function () {
            this.updateScrollLeft(this.scrollLeft);
        },
    },
    created: function () {
        window.addEventListener('resize', this.updateInitialElementWidth);
        var self = this;
        biigle.$require('events').$on('sidebar.toggle', function () {
            self.$nextTick(self.updateInitialElementWidth);
        });

        // Do not scroll down when the Spacebar is pressed.
        biigle.$require('keyboard').on(' ', function (e) {
            e.preventDefault();
        });
    },
    mounted: function () {
        this.$nextTick(this.updateInitialElementWidth);
    },
});
