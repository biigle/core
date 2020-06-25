biigle.$component('videos.components.annotationClip', {
    template: '<div class="annotation-clip"' +
        ' v-show="duration > 0"' +
        ' :style="style"' +
        ' :class="classObj"' +
        ' :title="title"' +
        ' @click.stop="select($event)"' +
        '>' +
            '<segment' +
                ' v-for="segment in segments"' +
                ' :annotation="annotation"' +
                ' :label="label"' +
                ' :frames="segment.frames"' +
                ' :gap="segment.gap"' +
                ' :clip-duration="clipDuration"' +
                ' @select="emitSelect"' +
                '></segment>' +
    '</div>',
    components: {
        segment: biigle.$require('videos.components.annotationSegment'),
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
    data: function () {
        return {
            //
        };
    },
    computed: {
        startFrame: function () {
            return this.annotation.startFrame;
        },
        endFrame: function () {
            return this.annotation.endFrame;
        },
        offset: function () {
            var offset = this.startFrame / this.duration * this.elementWidth;

            if (!this.annotation.isClip) {
                // If this is a single frame annotation at the very end of the video,
                // shift the offset to the left so the keyframe element does not overflow
                // the timeline and gets invisible. 9 is the width of a keyframe element.
                offset = Math.min(offset, this.elementWidth - 9);
            }

            return offset;
        },
        clipDuration: function () {
            return this.endFrame - this.startFrame;
        },
        width: function () {
            return this.clipDuration / this.duration * this.elementWidth;
        },
        style: function () {
            return {
                left: this.offset + 'px',
                width: this.width + 'px',
            };
        },
        segments: function () {
            var frames = [this.annotation.frames.slice()];
            var gaps = [false];
            var i = 0;
            var gapIndex;
            while ((gapIndex = frames[i].indexOf(null)) !== -1) {
                var oldFrames = frames[i];
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
        selected: function () {
            return this.annotation.isSelected;
        },
        classObj: function () {
            return {
                'annotation-clip--selected': this.selected,
                'annotation-clip--compact': this.shouldBeCompact,
                'annotation-clip--more-compact': this.shouldBeMoreCompact,
                'annotation-clip--tracking': this.annotation.tracking,
                'annotation-clip--dark': this.annotation.tracking && this.hasDarkColor,
            };
        },
        minTimeBetweenFrames: function () {
            var min = Infinity;
            var frames = this.annotation.frames.filter(function (value) {
                return value !== null;
            });

            for (var i = frames.length - 1; i > 0; i--) {
                min = Math.min(min, frames[i] - frames[i - 1]);
            }

            return min;
        },
        minDistanceBetweenFrames: function () {
            var distanceInPercent = this.minTimeBetweenFrames / this.duration;

            return distanceInPercent * this.elementWidth;
        },
        shouldBeCompact: function () {
            // Twice the width of a regular keyframe element.
            return this.minDistanceBetweenFrames <= 18;
        },
        shouldBeMoreCompact: function () {
            // Twice the width of a compact keyframe element.
            return this.minDistanceBetweenFrames <= 6;
        },
        title: function () {
            return this.annotation.tracking ? 'Tracking in progress' : '';
        },
        hasDarkColor: function () {
            // see: https://stackoverflow.com/a/12043228/1796523
            var color = this.label.color || '000000';
            var rgb = parseInt(color, 16);
            var r = (rgb >> 16) & 0xff;
            var g = (rgb >>  8) & 0xff;
            var b = (rgb >>  0) & 0xff;
            var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            return luma < 128;
        },
    },
    methods: {
        emitSelect: function (time, shift) {
            if (this.selected && shift) {
                this.$emit('deselect', this.annotation);
            } else {
                this.$emit('select', this.annotation, time, shift);
            }
        },
        select: function (e) {
            var time = this.startFrame + ((e.clientX - this.$el.getBoundingClientRect().left) / this.$el.clientWidth * this.clipDuration);
            this.emitSelect(time, e.shiftKey);
        },
    },
});
