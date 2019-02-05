biigle.$component('videos.components.annotationClip', {
    template: '<div class="annotation-clip"' +
        ' v-show="duration > 0"' +
        ' :style="style"' +
        ' :class="classObj"' +
        ' :title="title"' +
        ' @click.stop="select($event)"' +
        '>' +
            '<keyframe' +
                ' v-for="(frame, i) in keyframes"' +
                ' :frame="frame"' +
                ' @select="selectFrame(i)"' +
                '></keyframe>' +
    '</div>',
    components: {
        keyframe: {
            template: '<span class="annotation-keyframe" :style="style" :class="classObj" @click.stop="emitSelect"></span>',
            props: {
                frame: {
                    type: Object,
                    required: true,
                },
            },
            computed: {
                offset: function () {
                    return (this.frame.time - this.$parent.startFrame) / this.$parent.clipDuration;
                },
                style: function () {
                    return {
                        left: (this.offset * 100) + '%',
                        'background-color': '#' + this.$parent.color,
                    };
                },
                classObj: function () {
                    return {
                        'annotation-keyframe--selected': this.frame.selected,
                    };
                },
            },
            methods: {
                emitSelect: function () {
                    this.$emit('select');
                },
            },
        },
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
            return this.annotation.frames[0];
        },
        endFrame: function () {
            return this.annotation.frames[this.annotation.frames.length - 1];
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
        color: function () {
            return this.label.color || '000000';
        },
        style: function () {
            return {
                left: this.offset + 'px',
                width: this.width + 'px',
                'background-color': '#' + this.color + '66',
            };
        },
        keyframes: function () {
            var selected = this.annotation.selected;

            return this.annotation.frames.map(function (time) {
                return {
                    time: time,
                    selected: selected === time,
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
        minTimeBetweenKeyframes: function () {
            var min = Infinity;
            for (var i = this.keyframes.length - 1; i > 0; i--) {
                min = Math.min(min, this.keyframes[i].time - this.keyframes[i - 1].time);
            }

            return min;
        },
        minDistanceBetweenKeyframes: function () {
            var distanceInPercent = this.minTimeBetweenKeyframes / this.duration;

            return distanceInPercent * this.elementWidth;
        },
        shouldBeCompact: function () {
            // Twice the width of a regular keyframe element.
            return this.minDistanceBetweenKeyframes <= 18;
        },
        shouldBeMoreCompact: function () {
            // Twice the width of a compact keyframe element.
            return this.minDistanceBetweenKeyframes <= 6;
        },
        title: function () {
            return this.annotation.tracking ? 'Tracking in progress' : '';
        },
    },
    methods: {
        emitSelect: function (time) {
            this.$emit('select', this.annotation, time);
        },
        selectFrame: function (index) {
            this.emitSelect(this.annotation.frames[index]);
        },
        select: function (e) {
            this.emitSelect(this.startFrame + ((e.clientX - e.target.getBoundingClientRect().left) / e.target.clientWidth * this.clipDuration));
        },
    },
    mounted: function () {
        //
    },
});
