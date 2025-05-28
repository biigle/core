<template>
    <div class="video-timeline" :style="styleObject" :class="classObject">
        <div
            v-if="!collapsed && !fullHeight"
            class="grab-border"
            @mousedown="emitStartResize"
            ></div>
        <div class="static-strip">
            <current-time
                :current-time="currentTime"
                :seeking="seeking"
                ></current-time>
            <track-headers
                v-if="!collapsed"
                ref="trackheaders"
                :tracks="annotationTracks"
                :scroll-top="scrollTop"
                ></track-headers>
        </div>
        <scroll-strip
            ref="scrollStrip"
            :tracks="annotationTracks"
            :duration="duration"
            :current-time="currentTime"
            :seeking="seeking"
            :showThumbnailPreview="showThumbnailPreview"
            :videoUuid="videoUuid"
            :has-error="hasError"
            :collapsed="collapsed"
            :full-height="fullHeight"
            @seek="emitSeek"
            @select="emitSelect"
            @deselect="emitDeselect"
            @scroll-y="handleScrollY"
            @hover-time="updateHoverTime"
        ></scroll-strip>
    </div>
</template>

<script>
import CurrentTime from './currentTime.vue';
import ScrollStrip from './scrollStrip.vue';
import TrackHeaders from './trackHeaders.vue';

export default {
    emits: [
        'deselect',
        'seek',
        'select',
        'start-resize',
    ],
    components: {
        currentTime: CurrentTime,
        trackHeaders: TrackHeaders,
        scrollStrip: ScrollStrip,
    },
    props: {
        annotations: {
            type: Array,
            default() {
                return [];
            },
        },
        video: {
            required: true,
            validator(value) {
                // In case of a popup window, the video may be a HTMLVideoElement of a
                // different context which would fail a simple "type: HTMLVideoElement"
                // check. We do the type check here and have a fallback based on the
                // constructor name for the popup.
                return value instanceof HTMLVideoElement || value.constructor.name === 'HTMLVideoElement';
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
        pendingAnnotation: {
            type: Object,
            default() {
                return null;
            },
        },
        showThumbnailPreview: {
            type: Boolean,
            default: true,
        },
        videoUuid: {
            type: String,
            required: true,
        },
        hasError: {
            type: Boolean,
            default: false
        },
        collapsed: {
            type: Boolean,
            default: false,
        },
        fullHeight: {
            type: Boolean,
            default: false,
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
            let annotations = this.annotations;

            if (this.pendingAnnotation) {
                annotations = annotations.slice();
                annotations.push(this.pendingAnnotation);
            }

            annotations.forEach(function (annotation) {
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
            let annotations = this.annotations;

            if (this.pendingAnnotation) {
                annotations = annotations.slice();
                annotations.push(this.pendingAnnotation);
            }

            annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.label_id)) {
                        map[label.label_id] = [];
                    }

                    map[label.label_id].push(annotation);
                });
            });

            return Object.keys(map).map((labelId) => {
                return {
                    id: labelId,
                    label: this.labelMap[labelId],
                    lanes: this.getAnnotationTrackLanes(map[labelId])
                };
            });
        },
        styleObject() {
            if (this.heightOffset !== 0 && !this.fullHeight && !this.collapsed) {
                return `height: calc(35% + ${this.heightOffset}px);`;
            }

            return '';
        },
        classObject() {
            return {
                'full-height': this.fullHeight,
            };
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

            annotations.forEach((annotation) => {
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
            });

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
        reset() {
            this.currentTime = 0;
            this.duration = 0;
            this.scrollTop = 0;
            this.hoverTime = 0;
            this.$refs.scrollStrip.reset();
        },
    },
    watch: {
        heightOffset() {
            this.$refs.scrollStrip.updateHeight();
        },
    },
    created() {
        this.video.addEventListener('play', this.startUpdateLoop);
        this.video.addEventListener('pause', this.stopUpdateLoop);
        this.video.addEventListener('seeked', this.updateCurrentTime);

        // If the video timeline is shown in the popup and the video is already loaded.
        if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            this.setDuration();
            this.updateCurrentTime();

            if (!this.video.paused) {
                this.startUpdateLoop();
            }
        } else {
            this.video.addEventListener('loadedmetadata', this.setDuration);
        }
    },
};
</script>
