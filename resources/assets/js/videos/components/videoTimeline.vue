<template>
    <div class="video-timeline" :style="styleObject">
        <div class="grab-border"
            @mousedown="emitStartResize"
            ></div>
        <div class="static-strip">
            <current-time
                :current-time="currentTime"
                :seeking="seeking"
                ></current-time>
            <track-headers ref="trackheaders"
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
            :videoId="videoId"
            :has-error="hasError"
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
            type: HTMLVideoElement,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
            default: 0
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
        videoId: {
            type: Number,
            required: true,
        },
        hasError: {
            type: Boolean,
            default: false
        },
    },
    data() {
        return {
            animationFrameId: null,
            // Refresh the current time only every x ms.
            refreshRate: 30,
            refreshLastTime: Date.now(),
            currentTime: 0,
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
            if (this.heightOffset !== 0) {
                return `height: calc(35% + ${this.heightOffset}px);`;
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
            let lanes = [[]];

            annotations.forEach((annotation) => {
                let range = [annotation.startFrame, annotation.endFrame];
                let lane = 0;
                let set = false;

                outerloop: while (!set) {
                    if (!lanes[lane]) {
                        lanes[lane] = [];
                    } else {
                        for (let i = lanes[lane].length - 1; i >= 0; i--) {
                            if (annotation.overlapsTime(lanes[lane][i])) {
                                lane += 1;
                                continue outerloop;
                            }
                        }
                    }

                    lanes[lane].push(annotation);
                    set = true;
                }
            });

            return lanes;
        },
        updateHoverTime(time) {
            this.hoverTime = time;
        },
        emitStartResize(e) {
            this.$emit('start-resize', e);
        },
        reset() {
            this.currentTime = 0;
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
        // this.video.addEventListener('timeupdate', this.updateCurrentTime);
        this.video.addEventListener('play', this.startUpdateLoop);
        this.video.addEventListener('pause', this.stopUpdateLoop);
        this.video.addEventListener('seeked', this.updateCurrentTime);
    },
};
</script>
