biigle.$component('components.videoTimeline', {
    template: '<div class="video-timeline">' +
        '<div class="static-strip">' +
            '<div class="current-time" v-text="currentTimeString"></div>' +
            '<div class="track-labels">' +

            '</div>' +
        '</div>' +
        '<div class="scroll-strip">' +
            '<video-progress' +
                ' :duration="duration" ' +
                ' :current-time="currentTime" ' +
                ' @seek="emitSeek"' +
                '></video-progress>' +
            '<div class="annotation-tracks">' +

            '</div>' +
        '</div>' +
    '</div>',
    components: {
        videoProgress: biigle.$require('components.videoProgress'),
    },
    props: {
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
        };
    },
    computed: {
        //
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
