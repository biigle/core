biigle.$component('videos.components.scrollStrip', {
    template:
    '<div class="scroll-strip" @wheel.stop="handleScroll">' +
        '<div class="scroll-strip__scroller" ref="scroller" :style="scrollerStyle">' +
            '<video-progress' +
                ' :bookmarks="bookmarks"' +
                ' :duration="duration"' +
                ' @seek="emitSeek"' +
                '></video-progress>' +
            '<annotation-tracks' +
                ' :tracks="tracks"' +
                ' :duration="duration"' +
                ' :element-width="elementWidth"' +
                ' @select="emitSelect"' +
                ' @deselect="emitDeselect"' +
                ' @scroll-y="emitScrollY"' +
                '></annotation-tracks>' +
            '<span class="time-indicator" :class="indicatorClass" :style="indicatorStyle"></span>' +
        '</div>' +
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
            zoomFactor: 0.1,
            initialElementWidth: 0,
            scrollerLeft: 0,
        };
    },
    computed: {
        currentTimeOffset: function () {
            if (this.duration > 0) {
                return this.elementWidth * this.currentTime / this.duration;
            }

            return 0;
        },
        indicatorClass: function () {
            return {
                'time-indicator--seeking': this.seeking,
            };
        },
        indicatorStyle: function () {
            return 'transform: translateX(' + this.currentTimeOffset + 'px);';
        },
        scrollerStyle: function () {
            return {
                width: (this.zoom * 100) + '%',
                left: this.scrollerLeft + 'px',
            };
        },
        elementWidth: function () {
            return this.initialElementWidth * this.zoom;
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
        handleScroll: function (e) {
            if (e.shiftKey && e.deltaY !== 0) {
                var xRel = e.clientX - this.$el.getBoundingClientRect().left;
                var xAbs = e.clientX - this.$refs.scroller.getBoundingClientRect().left;
                var xPercent = xAbs / this.elementWidth;

                this.zoom = Math.max(1, this.zoom + this.zoomFactor * (1 - e.deltaY));

                this.$nextTick(function () {
                    var newRect = this.$refs.scroller.getBoundingClientRect();
                    var newXAbs = xPercent * this.elementWidth;
                    var left = Math.round(xRel - newXAbs);
                    // The left and right edge of scroller should not be moved inside
                    // the parent element.
                    left = Math.max(Math.min(0, left),this.initialElementWidth - this.elementWidth);
                    this.scrollerLeft = left;
                });
            }
        },
    },
    watch: {
        //
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
