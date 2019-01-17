biigle.$component('videos.components.annotationClip', {
    template: '<div class="annotation-clip"' +
        ' v-show="duration > 0"' +
        ' :style="style"' +
        ' :class="classObj"' +
        ' @click.stop="emitSelectFrame(0)"' +
        '>' +
            '<keyframe v-for="(frame, i) in keyframes"' +
                ' :frame="frame"' +
                ' @select="emitSelectFrame(i)"' +
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
        labelId: {
            type: String,
            required: true,
        },
        duration: {
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
            return this.startFrame / this.duration;
        },
        clipDuration: function () {
            return this.endFrame - this.startFrame;
        },
        width: function () {
            return this.clipDuration / this.duration;
        },
        color: function () {
            var labelId = parseInt(this.labelId);
            for (var i = this.annotation.labels.length - 1; i >= 0; i--) {
                if (this.annotation.labels[i].label_id === labelId) {
                    return this.annotation.labels[i].label.color;
                }
            }

            return '000000';
        },
        style: function () {
            return {
                left: (this.offset * 100) + '%',
                width: (this.width * 100) + '%',
                'background-color': '#' + this.color + '66',
            };
        },
        keyframes: function () {
            var selected = this.annotation.selected;

            return this.annotation.frames.map(function (time, index) {
                return {
                    time: time,
                    selected: selected === index,
                };
            });
        },
        selected: function () {
            return this.annotation.selected !== false;
        },
        classObj: function () {
            return {
                'annotation-clip--selected': this.selected,
            };
        },
    },
    methods: {
        emitSelectFrame: function (index) {
            this.$emit('select', this.annotation, index);
        },
    },
    mounted: function () {
        //
    },
});
