biigle.$component('videos.components.scrollStrip', {
    template: '<div class="scroll-strip">' +
        '<video-progress' +
            ' :bookmarks="bookmarks"' +
            ' :duration="duration"' +
            ' @seek="emitSeek"' +
            '></video-progress>' +
        '<annotation-tracks' +
            ' :annotations="annotations"' +
            ' :duration="duration"' +
            ' @select="emitSelect"' +
            ' @deselect="emitDeselect"' +
            ' @update="emitUpdateTracks"' +
            ' @scroll-y="emitScrollY"' +
            '></annotation-tracks>' +
        '<span class="time-indicator" :style="indicatorStyle"></span>' +
    '</div>',
    components: {
        videoProgress: biigle.$require('videos.components.videoProgress'),
        annotationTracks: biigle.$require('videos.components.annotationTracks'),
    },
    props: {
        annotations: {
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
    },
    data: function () {
        return {
            elementWidth: 0,
        };
    },
    computed: {
        currentTimeOffset: function () {
            if (this.duration > 0) {
                return Math.round(this.elementWidth * this.currentTime / this.duration);
            }

            return 0;
        },
        indicatorStyle: function () {
            return 'transform: translateX(' + this.currentTimeOffset + 'px);';
        },
    },
    methods: {
        updateElementWidth: function () {
            this.elementWidth = this.$el.clientWidth;
        },
        emitSeek: function (time) {
            this.$emit('seek', time);
        },
        emitSelect: function (annotation, index) {
            this.$emit('select', annotation, index);
        },
        emitDeselect: function () {
            this.$emit('deselect');
        },
        emitUpdateTracks: function (labelId, laneCount) {
            this.$emit('update-tracks', labelId, laneCount);
        },
        emitScrollY: function (scrollTop) {
            this.$emit('scroll-y', scrollTop);
        },
    },
    created: function () {
        window.addEventListener('resize', this.updateElementWidth);
        var self = this;
        biigle.$require('events').$on('sidebar.toggle', function () {
            self.$nextTick(self.updateElementWidth);
        });

        // Do not scroll down when the Spacebar is pressed.
        biigle.$require('keyboard').on(' ', function (e) {
            e.preventDefault();
        });
    },
    mounted: function () {
        this.updateElementWidth();
    },
});
