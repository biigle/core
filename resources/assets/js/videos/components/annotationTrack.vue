<template>
    <div class="annotation-track"></div>
</template>

<script>
const LANE_MARGIN_BOTTOM = 5;

import SvgAnnotation from '../models/SvgAnnotation.js';
import {KEYFRAME_HEIGHT} from '../models/SvgAnnotation.js';
import { SVG } from '@svgdotjs/svg.js'

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
        annotationCount() {
            return this.lanes.reduce((c, l) => c + l.length, 0);
        },
        trackHeight() {
            return this.lanes.length * (KEYFRAME_HEIGHT + LANE_MARGIN_BOTTOM) - LANE_MARGIN_BOTTOM;
        },
        xFactor() {
            return this.elementWidth / this.duration;
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
            if (this.laneCache.length > this.lanes.length) {
                this.laneCache
                    .splice(this.lanes.length)
                    .forEach(l => l.remove());
            }

            this.lanes.forEach(this.drawLane);
        },
        drawLane(lane, i) {
            if (!this.laneCache[i]) {
                const yOffset = i * (KEYFRAME_HEIGHT + LANE_MARGIN_BOTTOM);
                this.laneCache[i] = this.svg.group().attr({transform: `translate(0, ${yOffset})`});
            }
            const g = this.laneCache[i];
            lane.forEach((a) => this.drawAnnotation(a, g));
        },
        drawAnnotation(annotation, group) {
            const key = annotation.id;

            if (this.annotationCache[key]) {
                this.annotationCache[key].addTo(group);
            } else {
                const a = new SvgAnnotation({
                    annotation: annotation,
                    label: this.label,
                    svg: group,
                    xFactor: this.xFactor,
                    onSelect: this.emitSelect,
                    onDeselect: this.emitDeselect,
                });
                a.draw();
                this.annotationCache[key] = a;
            }
        },
    },
    watch: {
        elementWidth(width) {
            this.svg.size(Math.round(width), this.trackHeight);
        },
        trackHeight(height) {
            this.svg.size(this.elementWidth, Math.round(height));
        },
        xFactor(factor) {
            Object.values(this.annotationCache).forEach(a => a.updateXFactor(factor));
        },
        lanes() {
            if (this.annotationCount < Object.keys(this.annotationCache).length) {
                const annotationMap = {};
                this.lanes.forEach(l => l.forEach(a => annotationMap[a.id] = true));
                Object.keys(this.annotationCache)
                    .filter(k => !annotationMap[k])
                    .forEach((k) => {
                        this.annotationCache[k].remove();
                        delete this.annotationCache[k];
                    });
            }

            this.draw();
        },
    },
    created() {
        this.annotationCache = {};
        this.laneCache = [];
        this.svg = SVG().size(this.elementWidth, this.trackHeight);
        this.draw();
    },
    mounted() {
        this.svg.addTo(this.$el);
    },
};
</script>
