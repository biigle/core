biigle.$component('videos.components.annotationKeyframe', {
    template:
    '<span' +
        ' class="annotation-keyframe"' +
        ' :style="style"' +
        ' :class="classObj"' +
        ' @click.stop="emitSelect"' +
        '></span>',
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
        offset: function () {
            return (this.frame.time - this.startFrame) / this.segmentDuration;
        },
        style: function () {
            return {
                left: (this.offset * 100) + '%',
                'background-color': this.color,
            };
        },
        classObj: function () {
            return {
                'annotation-keyframe--selected': this.frame.selected,
            };
        },
    },
    methods: {
        emitSelect: function (e) {
            this.$emit('select', this.frame, e.shiftKey);
        },
    },
});
