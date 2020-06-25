biigle.$component('videos.components.annotationSegment', {
    template:
    '<div' +
        ' class="annotation-segment"' +
        ' :class="classObject"' +
        ' :style="style"' +
        '>' +
        '<keyframe' +
            ' v-for="frame in keyframes"' +
            ' :frame="frame"' +
            ' :start-frame="startFrame"' +
            ' :segment-duration="segmentDuration"' +
            ' :color="color"' +
            ' @select="selectFrame"' +
            '></keyframe>' +
    '</div>',
    components: {
        keyframe: biigle.$require('videos.components.annotationKeyframe'),
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
        startFrame: function () {
            return this.frames[0];
        },
        endFrame: function () {
            return this.frames[this.frames.length - 1];
        },
        segmentDuration: function () {
            return this.endFrame - this.startFrame;
        },
        classObject: function () {
            return {
                'annotation-segment--gap': this.gap,
            };
        },
        width: function () {
            return 100 * this.segmentDuration / this.clipDuration;
        },
        color: function () {
            return '#' + (this.label.color || '000000');
        },
        style: function () {
            var style = {width: this.width + '%'};

            if (this.gap) {
                style['border-top-color'] = this.color;
            } else {
                style['background-color'] = this.color + '66';
            }

            return style;
        },
        keyframes: function () {
            if (this.gap) {
                return [];
            }

            var selected = this.annotation.selected;

            return this.frames.map(function (time) {
                return {
                    time: time,
                    selected: selected === time,
                };
            });
        },
    },
    methods: {
        selectFrame: function (frame, shift) {
            this.$emit('select', frame.time, shift);
        },
    },
});
