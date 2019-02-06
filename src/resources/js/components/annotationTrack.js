biigle.$component('videos.components.annotationTrack', {
    template: '<div class="annotation-track">' +
        '<div class="annotation-lane" v-for="lane in lanes">' +
            '<annotation-clip v-for="annotation in lane"' +
                ' :annotation="annotation"' +
                ' :element-width="elementWidth"' +
                ' :label="label"' +
                ' :duration="duration"' +
                ' @select="emitSelect"' +
                ' @deselect="emitDeselect"' +
                '></annotation-clip>' +
        '</div>' +
    '</div>',
    components: {
        annotationClip: biigle.$require('videos.components.annotationClip'),
    },
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
    data: function () {
        return {
            //
        };
    },
    computed: {
        //
    },
    methods: {
        emitSelect: function (annotation, time, shift) {
            this.$emit('select', annotation, time, shift);
        },
        emitDeselect: function (annotation) {
            this.$emit('deselect', annotation);
        },
    },
    watch: {
        //
    },
});
