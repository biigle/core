biigle.$component('components.videoTimeline', {
    template: '<div class="video-timeline">' +
        '<div class="static-strip">' +
            '<div class="current-time" v-text="currentTimeString"></div>' +
            '<track-headers ref="trackheaders"' +
                ' :labels="labelMap"' +
                ' :lane-counts="laneCounts"' +
                ' :scroll-top="scrollTop"' +
                '></track-headers>' +
        '</div>' +
        '<scroll-strip' +
            ' :annotations="annotations"' +
            ' :duration="duration"' +
            ' :current-time="currentTime"' +
            ' @seek="emitSeek"' +
            ' @select="emitSelect"' +
            ' @deselect="emitDeselect"' +
            ' @update-tracks="handleUpdatedTracks"' +
            ' @scroll-y="handleScrollY"' +
        '></scroll-strip>' +
    '</div>',
    components: {
        trackHeaders: biigle.$require('components.trackHeaders'),
        scrollStrip: biigle.$require('components.scrollStrip'),
    },
    props: {
        annotations: {
            type: Array,
            default: function () {
                return [];
            },
        },
        video: {
            type: HTMLVideoElement,
            required: true,
        },
    },
    data: function () {
        return {
            animationFrameId: null,
            // Update the current time only every x ms.
            updateInterval: 100,
            updateLastTime: Date.now(),
            currentTime: 0,
            currentTimeDate: new Date(0),
            currentTimeString: '00:00:00.000',
            duration: 0,
            laneCounts: {},
            scrollTop: 0,
        };
    },
    computed: {
        labelMap: function () {
            var map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.id)) {
                        map[label.id] = label;
                    }
                });
            });

            return map;
        },
    },
    methods: {
        startUpdateLoop: function () {
            var now = Date.now();
            if (now - this.updateLastTime > this.updateInterval) {
                this.updateCurrentTime();
                this.updateLastTime = now;
            }
            this.animationFrameId = window.requestAnimationFrame(this.startUpdateLoop);
        },
        stopUpdateLoop: function () {
            this.updateCurrentTime();
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        },
        updateCurrentTime: function () {
            this.currentTime = this.video.currentTime;
            // setTime expects milliseconds, currentTime is in seconds.
            this.currentTimeDate.setTime(this.currentTime * 1000);
            // Extract the "14:48:00.000" part from a string like
            // "2011-10-05T14:48:00.000Z".
            this.currentTimeString = this.currentTimeDate
                .toISOString()
                .split('T')[1]
                .slice(0, -1);
        },
        setDuration: function () {
            this.duration = this.video.duration;
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
        handleUpdatedTracks: function (labelId, laneCount) {
            Vue.set(this.laneCounts, labelId, laneCount);
        },
        handleScrollY: function (scrollTop) {
            this.scrollTop = scrollTop;
        },
    },
    watch: {
        //
    },
    created: function () {
        // this.video.addEventListener('timeupdate', this.updateCurrentTime);
        this.video.addEventListener('play', this.startUpdateLoop);
        this.video.addEventListener('pause', this.stopUpdateLoop);
        this.video.addEventListener('loadedmetadata', this.setDuration);
        this.video.addEventListener('seeked', this.updateCurrentTime);
    },
    mounted: function () {
        //
    },
});
