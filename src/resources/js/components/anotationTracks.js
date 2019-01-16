biigle.$component('components.annotationTracks', {
    template: '<div class="annotation-tracks"' +
        ' @click="emitDeselect"' +
        ' @scroll.stop="handleScroll"' +
        '>' +
            '<annotation-track v-for="(annotations, labelId) in tracks"' +
                ' :annotations="annotations"' +
                ' :labelId="labelId"' +
                ' :duration="duration"' +
                ' @select="emitSelect"' +
                ' @update="emitUpdate"' +
                '></annotation-track>' +
    '</div>',
    components: {
        annotationTrack: biigle.$require('components.annotationTrack'),
    },
    props: {
        annotations: {
            type: Array,
            default: function () {
                return [];
            },
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
        tracks: function () {
            var map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (label) {
                    if (!map.hasOwnProperty(label.id)) {
                        map[label.id] = [];
                    }

                    map[label.id].push(annotation);
                });
            });

            return map;
        },
    },
    methods: {
        emitSelect: function (annotation, index) {
            this.$emit('select', annotation, index);

        },
        emitDeselect: function () {
            this.$emit('deselect');
        },
        emitUpdate: function (labelId, laneCount) {
            this.$emit('update', labelId, laneCount);
        },
        handleScroll: function () {
            this.$emit('scroll-y', this.$el.scrollTop);
        },
    },
});
