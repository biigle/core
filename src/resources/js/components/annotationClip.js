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
            return this.startFrame / this.duration * this.elementWidth;
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
            return this.annotation.selected !== false;
        },
        classObj: function () {
            return {
                'annotation-clip--selected': this.selected,
                'annotation-clip--compact': this.shouldBeCompact,
                'annotation-clip--more-compact': this.shouldBeMoreCompact,
                'annotation-clip--tracking': this.annotation.tracking,
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
