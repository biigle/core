<template>
    <div
        class="annotation-tracks"
        @click="emitDeselect"
        @mousedown="startDragging"
        @mouseup="stopDragging"
        @mousemove="continueDragging"
        @scroll.stop="updateScrollTop"
        >
            <annotation-track v-for="track in tracks"
                :key="track.id"
                :label="track.label"
                :lanes="track.lanes"
                :duration="duration"
                :element-width="elementWidth"
                @select="emitSelect"
                @deselect="emitDeselectAnnotation"
                ></annotation-track>
    </div>
</template>

<script>
import AnnotationTrack from './annotationTrack.vue';

export default {
    components: {
        annotationTrack: AnnotationTrack,
    },
    props: {
        tracks: {
            type: Array,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        elementWidth: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            dragging: false,
            scrollTop: 0,
            scrollHeight: 0,
            clientHeight: 0,
        };
    },
    computed: {
        hasOverflowTop() {
            return this.scrollTop > 0;
        },
        hasOverflowBottom() {
            // Subtract 1 because sometimes scrollHeight is off by 1 and the breakpoint
            // is not reached when the annotation tracks are scrolled all the way down.
            let breakpoint = this.scrollHeight - this.clientHeight - 1;

            return breakpoint > 0 && this.scrollTop < breakpoint;
        },
    },
    methods: {
        emitSelect(annotation, time, shift) {
            this.$emit('select', annotation, time, shift);
        },
        emitDeselect() {
            this.$emit('deselect');
        },
        emitDeselectAnnotation(annotation) {
            this.$emit('deselect', annotation);
        },
        emitDragX(delta) {
            this.$emit('drag-x', delta);
        },
        startDragging(e) {
            this.dragging = e.buttons === 1;
        },
        stopDragging() {
            this.dragging = false;
        },
        continueDragging(e) {
             if (this.dragging) {
                if (e.buttons !== 1) {
                    // If the cursor left the element and the mouse button was released.
                    this.stopDragging();
                } else {
                    this.$el.scrollTop -= e.movementY;

                    if (e.movementX !== 0) {
                        this.emitDragX(e.movementX);
                    }
                }
            }
        },
        updateScrollTop() {
            this.scrollTop = this.$el.scrollTop;
        },
        updateScrollHeight() {
            this.scrollHeight = this.$el.scrollHeight;
        },
        updateClientHeight() {
            this.clientHeight = this.$el.clientHeight;
        },
    },
    watch: {
        tracks() {
            this.$nextTick(this.updateScrollHeight);
        },
        hasOverflowTop(has) {
            this.$emit('overflow-top', has);
        },
        hasOverflowBottom(has) {
            this.$emit('overflow-bottom', has);
        },
        scrollTop(scrollTop) {
            this.$emit('scroll-y', scrollTop);
        },
    },
    created() {
        window.addEventListener('resize', this.updateClientHeight);
    },
    mounted() {
        this.$nextTick(this.updateClientHeight);
    },
};
</script>
