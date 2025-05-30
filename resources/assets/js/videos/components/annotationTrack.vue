<template>
    <div class="annotation-track"></div>
</template>

<script>
const LANE_MARGIN_BOTTOM = 5;

/*<div class="annotation-lane">
        <annotation-clip v-for="annotation in lane"
            :key="annotation.id"
            :annotation="annotation"
            :element-width="elementWidth"
            :label="label"
            :duration="duration"
            @select="emitSelect"
            @deselect="emitDeselect"
            ></annotation-clip>
    </div>*/
import ZrenderAnnotation from '../models/ZrenderAnnotation.js';
import {HEIGHT as ANNOTATION_HEIGHT} from '../models/ZrenderAnnotation.js';
import {init} from 'zrender';

export default {
    emits: [
        'deselect',
        'select',
    ],
    props: {
        label: {
            type: Object,
            required: true,
        },
        lanes: {
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
    computed: {
        laneCount() {
            return this.lanes.length;
        },
        trackHeight() {
            return this.lanes.length * (ANNOTATION_HEIGHT + LANE_MARGIN_BOTTOM) - LANE_MARGIN_BOTTOM;
        },
    },
    methods: {
        emitSelect(annotation, time, shift) {
            this.$emit('select', annotation, time, shift);
        },
        emitDeselect(annotation) {
            this.$emit('deselect', annotation);
        },
        draw() {
            this.lanes.forEach(this.drawLane);
        },
        drawLane(lane, i) {
            const yOffset = i * (ANNOTATION_HEIGHT + LANE_MARGIN_BOTTOM);
            lane.forEach((a) => this.drawAnnotation(a, yOffset));
        },
        drawAnnotation(annotation, yOffset) {
            const a = new ZrenderAnnotation({
                annotation: annotation,
                label: this.label,
                zr: this.zr,
                xFactor: 1 / this.duration * this.elementWidth,
                yOffset: yOffset,
            });
            a.draw();
            this.zrCache[annotation.id] = a;
        },
        updateAnnotation(annotation) {
            const a = this.zrCache[annotation.id];
            if (!a) {
                return;
            }
            a.updateXFactor(1 / this.duration * this.elementWidth);
        },
    },
    watch: {
        elementWidth(width) {
            this.zr.resize({width: width});
            this.lanes.forEach(l => l.forEach(this.updateAnnotation));
        },
        trackHeight(height) {
            this.zr.resize({height: height});
        },
    },
    mounted() {
        this.zr = init(this.$el, {
            // The canvas renderer performs worse when zooming lots of annotations.
            // Also it can't handle canvases that are more than 16k px wide (because of
            // zooming).
            renderer: 'svg',
            devicePixelRatio: window.devicePixelRatio,
            height: this.trackHeight,
        });
        this.zrCache = {};
        this.draw();
    },
};
</script>
