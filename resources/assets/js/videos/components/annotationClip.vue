<template>
    <div class="annotation-clip"
        v-show="duration > 0"
        :style="style"
        :class="classObj"
        :title="title"
        @click.stop="select($event)"
        >
            <segment
                v-for="(segment, i) in segments"
                :key="i"
                :annotation="annotation"
                :label="label"
                :frames="segment.frames"
                :gap="segment.gap"
                :clip-duration="clipDuration"
                @select="emitSelect"
                ></segment>
    </div>
</template>

<script>
import Segment from './annotationSegment.vue';

export default {
    components: {
        segment: Segment,
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
        startFrame() {
            return this.annotation.startFrame;
        },
        endFrame() {
            return this.annotation.endFrame;
        },
        offset() {
            let offset = this.startFrame / this.duration * this.elementWidth;

            if (!this.annotation.isClip) {
                // If this is a single frame annotation at the very end of the video,
                // shift the offset to the left so the keyframe element does not overflow
                // the timeline and gets invisible. 9 is the width of a keyframe element.
                offset = Math.min(offset, this.elementWidth - 9);
            }

            return offset;
        },
        clipDuration() {
            return this.endFrame - this.startFrame;
        },
        width() {
            return this.clipDuration / this.duration * this.elementWidth;
        },
        style() {
            return {
                left: this.offset + 'px',
                width: this.width + 'px',
            };
        },
        segments() {
            let frames = [this.annotation.frames.slice()];
            let gaps = [false];
            let i = 0;
            let gapIndex;
            while ((gapIndex = frames[i].indexOf(null)) !== -1) {
                let oldFrames = frames[i];
                frames[i] = oldFrames.slice(0, gapIndex);
                frames.push([oldFrames[gapIndex - 1], oldFrames[gapIndex + 1]]);
                gaps.push(true);
                frames.push(oldFrames.slice(gapIndex + 1));
                gaps.push(false);
                i += 2;
            }

            return frames.map(function (value, index) {
                return {
                    frames: value,
                    gap: gaps[index],
                };
            });
        },
        selected() {
            return this.annotation.isSelected;
        },
        classObj() {
            return {
                'annotation-clip--selected': this.selected,
                'annotation-clip--compact': this.shouldBeCompact,
                'annotation-clip--more-compact': this.shouldBeMoreCompact,
                'annotation-clip--tracking': this.annotation.tracking,
                'annotation-clip--whole-frame': this.annotation.wholeFrame,
                'annotation-clip--dark': this.hasDarkColor,
                'annotation-clip--pending': this.annotation.pending,
            };
        },
        minTimeBetweenFrames() {
            let min = Infinity;
            let frames = this.annotation.frames.filter((value) => value !== null);

            for (let i = frames.length - 1; i > 0; i--) {
                min = Math.min(min, frames[i] - frames[i - 1]);
            }

            return min;
        },
        minDistanceBetweenFrames() {
            let distanceInPercent = this.minTimeBetweenFrames / this.duration;

            return distanceInPercent * this.elementWidth;
        },
        shouldBeCompact() {
            // Twice the width of a regular keyframe element.
            return this.minDistanceBetweenFrames <= 18;
        },
        shouldBeMoreCompact() {
            // Twice the width of a compact keyframe element.
            return this.minDistanceBetweenFrames <= 6;
        },
        title() {
            if (this.annotation.pending) {
                return 'Pending annotation';
            }

            if (this.annotation.tracking) {
                return 'Tracking in progress';
            }

            return '';
        },
        hasDarkColor() {
            // see: https://stackoverflow.com/a/12043228/1796523
            let color = this.label.color || '000000';
            let rgb = parseInt(color, 16);
            let r = (rgb >> 16) & 0xff;
            let g = (rgb >>  8) & 0xff;
            let b = (rgb >>  0) & 0xff;
            let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            return luma < 128;
        },
    },
    methods: {
        emitSelect(time, shift) {
            if (this.selected && shift) {
                this.$emit('deselect', this.annotation);
            } else {
                this.$emit('select', this.annotation, time, shift);
            }
        },
        select(e) {
            let time = this.startFrame + ((e.clientX - this.$el.getBoundingClientRect().left) / this.$el.clientWidth * this.clipDuration);
            this.emitSelect(time, e.shiftKey);
        },
    },
};
</script>
