<template>
    <div class="video-timeline" :style="styleObject" :class="classObject">
        <div
            v-if="!collapsed && !fullHeight"
            class="grab-border"
            @mousedown="emitStartResize"
            ></div>
        <div class="static-strip">
            <current-time
                v-if="!fullHeight"
                :current-time="currentTime"
                :seeking="seeking"
                ></current-time>
            <track-headers
                v-if="!collapsed"
                ref="trackheaders"
                :tracks="annotationTracks"
                :scroll-top="scrollTop"
                ></track-headers>
            <current-time
                v-if="fullHeight"
                :current-time="currentTime"
                :seeking="seeking"
                ></current-time>
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
import { computed } from 'vue'

export default {
    emits: [
        'deselect',
        'seek',
        'select',
        'start-resize',
        'reached-annotation',
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
            scrollTop: 0,
            hoverTime: 0,
            watchForCrossedFrame: false,
            nextAnnotationStartFrame: 0,
            annotationTracks: [],
            annotationStartFrames: [],
        };
    },
    provide() {
        return {
            fullHeight: computed(() => this.fullHeight),
        };
    },
    computed: {
        // In contrast to the properties that are updated based on the annotation revision
        // (see below), the labelMap can be a computed property because the labels do not
        // change frequently and watching their reactive properties is not expensive.
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
        annotationRevision() {
            let revision = this.annotations.reduce((acc, ann) => acc + ann.revision, 0);
            if (this.pendingAnnotation) {
                revision += this.pendingAnnotation.revision;
            }

            return revision;
        },
    },
    methods: {
        updateAnnotationTracks() {
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

            this.annotationTracks = Object.keys(map).map((labelId) => {
                return {
                    id: labelId,
                    label: this.labelMap[labelId],
                    lanes: this.getAnnotationTrackLanes(map[labelId])
                };
            });
        },
        updateAnnotationStartFrames() {
            this.annotationStartFrames = [...new Set(this.annotations.map(a => a.startFrame))]
                .sort((a, b) => a - b);
        },
        findNextAnnotationStartFrame(currentFrame) {
            currentFrame = this.roundTime(currentFrame > 0 ? currentFrame : this.currentTime);

            this.nextAnnotationStartFrame = this.annotationStartFrames.find(f => this.roundTime(f) > currentFrame);
        },
        roundTime(t) {
            // Make sure the video time and frame time are rounded to the same number of
            // decimals. otherwise the comparison below may not work correctly.
            // Example: 12.3 is smaller than 12.33 although the comparison expects
            // it to be equal.
            return Math.round(t * 1e4) / 1e4
        },
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

            const time = this.roundTime(this.currentTime);
            const startFrame = this.roundTime(this.nextAnnotationStartFrame);
            // The offset should make sure that the condition below is true for at least
            // one call of this function before the next annotation is hit. With 0.1 I
            // still saw some jumps over the "watch window" at the maximum 4x playback
            // speed so I chose 0.2 to be sure.
            const watchOffset = 0.2;

            // This check is used to emit the "reached-annotation" event only if the
            // playback was "near" the annotation before. Otherwise the event would also
            // fire if the user jumps over the annotation with manual seeking or if the
            // playback should resume at the exact frame after an automatic pause.
            if (time >= (startFrame - watchOffset) && time < startFrame) {
                this.watchForCrossedFrame = true;
            }

            if (this.watchForCrossedFrame && time >= startFrame) {
                this.watchForCrossedFrame = false;
                this.$emit('reached-annotation', this.nextAnnotationStartFrame)
                this.findNextAnnotationStartFrame(this.nextAnnotationStartFrame);
            }

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
        annotationRevision() {
            // The annotation revision is an efficient way to watch all annotations for
            // changes without having any expensive reactive watchers on arrays etc.
            // That is why the below methods are not implemented as computed properties.
            this.updateAnnotationTracks();
            this.updateAnnotationStartFrames();
            this.findNextAnnotationStartFrame();
        },
        pendingAnnotation(newPending, oldPending) {
            // The pending annotation is replaced on update and the revision would not
            // change, so we have to add an extra watcher for this. This only has to be
            // executed when the pending annotation is updated, i.e. not when the pending
            // annotations is created or deleted (because the revision will change in
            // this case).
            if (newPending && oldPending) {
                this.updateAnnotationTracks();
            }
        },
    },
    created() {
        this.video.addEventListener('play', this.startUpdateLoop);
        this.video.addEventListener('pause', this.stopUpdateLoop);
        this.video.addEventListener('seeked', this.updateCurrentTime);
        this.video.addEventListener('seeked', this.findNextAnnotationStartFrame);

        // If the video timeline is shown in the popup and the video is already loaded.
        if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            this.updateCurrentTime();
            this.findNextAnnotationStartFrame();

            if (!this.video.paused) {
                this.startUpdateLoop();
            }
        }
    },
};
</script>
