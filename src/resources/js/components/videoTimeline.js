biigle.$component('videos.components.videoTimeline', {
    template: '<div class="video-timeline">' +
        '<div class="static-strip">' +
            '<current-time' +
                ' :current-time="currentTime"' +
                ' :hover-time="hoverTime"' +
                ' :seeking="seeking"' +
                '></current-time>' +
            '<track-headers ref="trackheaders"' +
                ' :tracks="annotationTracks"' +
                ' :scroll-top="scrollTop"' +
                '></track-headers>' +
        '</div>' +
        '<scroll-strip' +
            ' :tracks="annotationTracks"' +
            ' :duration="duration"' +
            ' :current-time="currentTime"' +
            ' :bookmarks="bookmarks"' +
            ' :seeking="seeking"' +
            ' @seek="emitSeek"' +
            ' @select="emitSelect"' +
            ' @deselect="emitDeselect"' +
            ' @scroll-y="handleScrollY"' +
            ' @hover-time="updateHoverTime"' +
        '></scroll-strip>' +
    '</div>',
    components: {
        currentTime: biigle.$require('videos.components.currentTime'),
        trackHeaders: biigle.$require('videos.components.trackHeaders'),
        scrollStrip: biigle.$require('videos.components.scrollStrip'),
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
        bookmarks: {
            type: Array,
            default: function () {
                return [];
            },
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            animationFrameId: null,
            // Refresh the current time only every x ms.
            refreshRate: 30,
            refreshLastTime: Date.now(),
            currentTime: 0,
            duration: 0,
            scrollTop: 0,
            hoverTime: 0,
        };
    },
    computed: {
        labelMap: function () {
            var map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.label_id)) {
                        map[label.label_id] = label.label;
                    }
                });
            });

            return map;
        },
        annotationTracks: function () {
            var map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.label_id)) {
                        map[label.label_id] = [];
                    }

                    map[label.label_id].push(annotation);
                });
            });

            return Object.keys(map).map(function (labelId) {
                return {
                    label: this.labelMap[labelId],
                    lanes: this.getAnnotationTrackLanes(map[labelId])
                };
            }, this);
        },
    },
    methods: {
        startUpdateLoop: function () {
            var now = Date.now();
            if (now - this.refreshLastTime >= this.refreshRate) {
                this.updateCurrentTime();
                this.refreshLastTime = now;
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
        },
        setDuration: function () {
            this.duration = this.video.duration;
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
        handleScrollY: function (scrollTop) {
            this.scrollTop = scrollTop;
        },
        getAnnotationTrackLanes: function (annotations) {
            var timeRanges = [[]];
            var lanes = [[]];

            annotations.forEach(function (annotation) {
                var range = [
                    annotation.frames[0],
                    annotation.frames[annotation.frames.length - 1],
                ];
                var lane = 0;
                var set = false;

                outerloop: while (!set) {
                    if (!lanes[lane]) {
                        timeRanges[lane] = [];
                        lanes[lane] = [];
                    } else {
                        for (var i = timeRanges[lane].length - 1; i >= 0; i--) {
                            if (this.rangesCollide(timeRanges[lane][i], range)) {
                                lane += 1;
                                continue outerloop;
                            }
                        }
                    }

                    timeRanges[lane].push(range);
                    lanes[lane].push(annotation);
                    set = true;
                }
            }, this);

            return lanes;
        },
        rangesCollide: function (range1, range2) {
            // Start of range1 overlaps with range2.
            return range1[0] >= range2[0] && range1[0] < range2[1] ||
                // End of range1 overlaps with range2.
                range1[1] > range2[0] && range1[1] <= range2[1] ||
                // Start of range2 overlaps with range1.
                range2[0] >= range1[0] && range2[0] < range1[1] ||
                // End of range2 overlaps with range1.
                range2[1] > range1[0] && range2[1] <= range1[1] ||
                // range1 equals range2.
                range1[0] === range2[0] && range1[1] === range2[1];
        },
        updateHoverTime: function (time) {
            this.hoverTime = time;
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
