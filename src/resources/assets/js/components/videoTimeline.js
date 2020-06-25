biigle.$component('videos.components.videoTimeline', {
    template: '<div class="video-timeline"' +
        ' :style="styleObject"' +
        '>' +
        '<div class="grab-border"' +
            ' @mousedown="emitStartResize"' +
            '></div>' +
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
            ' ref="scrollStrip"' +
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
            default() {
                return [];
            },
        },
        video: {
            type: HTMLVideoElement,
            required: true,
        },
        bookmarks: {
            type: Array,
            default() {
                return [];
            },
        },
        seeking: {
            type: Boolean,
            default: false,
        },
        heightOffset: {
            type: Number,
            default: 0,
        },
    },
    data() {
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
        labelMap() {
            let map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.label_id)) {
                        map[label.label_id] = label.label;
                    }
                });
            });

            return map;
        },
        annotationTracks() {
            let map = {};
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
        styleObject() {
            if (this.heightOffset !== 0) {
                return 'height: calc(35% + ' + this.heightOffset + 'px);';
            }

            return '';
        },
    },
    methods: {
        startUpdateLoop() {
            let now = Date.now();
            if (now - this.refreshLastTime >= this.refreshRate) {
                this.updateCurrentTime();
                this.refreshLastTime = now;
            }
            this.animationFrameId = window.requestAnimationFrame(this.startUpdateLoop);
        },
        stopUpdateLoop() {
            this.updateCurrentTime();
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        },
        updateCurrentTime() {
            this.currentTime = this.video.currentTime;
        },
        setDuration() {
            this.duration = this.video.duration;
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
        handleScrollY(scrollTop) {
            this.scrollTop = scrollTop;
        },
        getAnnotationTrackLanes(annotations) {
            let timeRanges = [[]];
            let lanes = [[]];

            annotations.forEach(function (annotation) {
                let range = [annotation.startFrame, annotation.endFrame];
                let lane = 0;
                let set = false;

                outerloop: while (!set) {
                    if (!lanes[lane]) {
                        timeRanges[lane] = [];
                        lanes[lane] = [];
                    } else {
                        for (let i = timeRanges[lane].length - 1; i >= 0; i--) {
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
        rangesCollide(range1, range2) {
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
        updateHoverTime(time) {
            this.hoverTime = time;
        },
        emitStartResize(e) {
            this.$emit('start-resize', e);
        },
    },
    watch: {
        heightOffset() {
            this.$refs.scrollStrip.updateHeight();
        },
    },
    created() {
        // this.video.addEventListener('timeupdate', this.updateCurrentTime);
        this.video.addEventListener('play', this.startUpdateLoop);
        this.video.addEventListener('pause', this.stopUpdateLoop);
        this.video.addEventListener('loadedmetadata', this.setDuration);
        this.video.addEventListener('seeked', this.updateCurrentTime);
    },
    mounted() {
        //
    },
});
