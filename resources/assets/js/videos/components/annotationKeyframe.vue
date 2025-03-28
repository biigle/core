<template>
    <span
        class="annotation-keyframe"
        :style="style"
        :class="classObj"
        @click.stop="emitSelect"
        ></span>
</template>

<script>
export default {
    emits: ['select'],
    props: {
        frame: {
            type: Object,
            required: true,
        },
        startFrame: {
            type: Number,
            required: true,
        },
        segmentDuration: {
            type: Number,
            required: true,
        },
        color: {
            type: String,
            required: true,
        },
    },
    computed: {
        offset() {
            return (this.frame.time - this.startFrame) / this.segmentDuration;
        },
        style() {
            return {
                left: (this.offset * 100) + '%',
                'background-color': this.color,
            };
        },
        classObj() {
            return {
                'annotation-keyframe--selected': this.frame.selected,
            };
        },
    },
    methods: {
        emitSelect(e) {
            this.$emit('select', this.frame, e.shiftKey);
        },
    },
};
</script>
