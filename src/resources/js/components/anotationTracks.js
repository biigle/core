biigle.$component('videos.components.annotationTracks', {
    template: '<div class="annotation-tracks"' +
        ' @click="emitDeselect"' +
        ' @scroll.stop="handleScroll"' +
        '>' +
            '<annotation-track v-for="track in tracks"' +
                ' :label="track.label"' +
                ' :lanes="track.lanes"' +
                ' :duration="duration"' +
                ' :element-width="elementWidth"' +
                ' @select="emitSelect"' +
                '></annotation-track>' +
    '</div>',
    components: {
        annotationTrack: biigle.$require('videos.components.annotationTrack'),
    },
    props: {
        tracks: {
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
        emitSelect: function (annotation, time) {
            this.$emit('select', annotation, time);
        },
        emitDeselect: function () {
            this.$emit('deselect');
        },
        handleScroll: function () {
            this.$emit('scroll-y', this.$el.scrollTop);
        },
    },
});
