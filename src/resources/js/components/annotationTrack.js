biigle.$component('videos.components.annotationTrack', {
    template: '<div class="annotation-track">' +
        '<div class="annotation-lane" v-for="lane in lanes">' +
            '<annotation-clip v-for="annotation in lane"' +
                ' :annotation="annotation"' +
                ' :label-id="labelId"' +
                ' :duration="duration"' +
                ' @select="emitSelect"' +
                '></annotation-clip>' +
        '</div>' +
    '</div>',
    components: {
        annotationClip: biigle.$require('videos.components.annotationClip'),
    },
    props: {
        annotations: {
            type: Array,
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
        lanes: function () {
            var timeRanges = [[]];
            var lanes = [[]];

            this.annotations.forEach(function (annotation) {
                var range = [
                    annotation.frames[0],
                    annotation.frames[annotation.frames.length - 1],
                ];
                var lane = 0;
                var set = false;

                outerloop: while (!set) {
                    if (!lanes[lane]) {
                        timeRanges[lane] = [];
                        lanes[lane] = [];
                    } else {
                        for (var i = timeRanges[lane].length - 1; i >= 0; i--) {
                            if (this.rangesCollide(timeRanges[lane][i], range)) {
                                lane += 1;
                                continue outerloop;
                            }
                        }
                    }

                    timeRanges[lane].push(range);
                    lanes[lane].push(annotation);
                    set = true;
                }
            }, this);

            return lanes;
        },
    },
    methods: {
        emitSelect: function (annotation, time) {
            this.$emit('select', annotation, time);
        },
        rangesCollide: function (range1, range2) {
            // Start of range1 overlaps with range2.
            return range1[0] >= range2[0] && range1[0] < range2[1] ||
                // End of range1 overlaps with range2.
                range1[1] > range2[0] && range1[1] <= range2[1] ||
                // Start of range2 overlaps with range1.
                range2[0] >= range1[0] && range2[0] < range1[1] ||
                // End of range2 overlaps with range1.
                range2[1] > range1[0] && range2[1] <= range1[1] ||
                // range1 equals range2.
                range1[0] === range2[0] && range1[1] === range2[1];
        },
    },
    watch: {
        lanes: {
            immediate: true,
            handler: function (lanes) {
                this.$emit('update', this.labelId, lanes.length);
            },
        },
    },
});
