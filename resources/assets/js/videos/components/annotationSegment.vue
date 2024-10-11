<template>
    <div
        class="annotation-segment"
        :class="classObject"
        :style="style"
        >
        <keyframe
            v-for="frame in keyframes"
            :key="frame.time"
            :frame="frame"
            :start-frame="startFrame"
            :segment-duration="segmentDuration"
            :color="color"
            @select="selectFrame"
            ></keyframe>
    </div>
</template>

<script>
import Keyframe from './annotationKeyframe.vue';

export default {
    components: {
        keyframe: Keyframe,
    },
    props: {
        annotation: {
            type: Object,
            required: true,
        },
        label: {
            type: Object,
            required: true,
        },
        frames: {
            type: Array,
            required: true,
        },
        gap: {
            type: Boolean,
            default: false,
        },
        clipDuration: {
            type: Number,
            required: true,
        },
    },
    computed: {
        startFrame() {
            return this.frames[0];
        },
        endFrame() {
            return this.frames[this.frames.length - 1];
        },
        segmentDuration() {
            return this.endFrame - this.startFrame;
        },
        classObject() {
            return {
                'annotation-segment--gap': this.gap,
            };
        },
        width() {
            return 100 * this.segmentDuration / this.clipDuration;
        },
        color() {
            return '#' + (this.label.color || '000000');
        },
        style() {
            let style = {width: this.width + '%'};

            if (this.gap) {
                style['border-top-color'] = this.color;
            } else {
                style['background-color'] = this.color + '66';
            }

            return style;
        },
        keyframes() {
            if (this.gap) {
                return [];
            }

            let selected = this.annotation.selected;

            return this.frames.map(function (time) {
                return {
                    time: time,
                    selected: selected === time,
                };
            });
        },
    },
    methods: {
        selectFrame(frame, shift) {
            this.$emit('select', frame.time, shift);
        },
    },
};
</script>
