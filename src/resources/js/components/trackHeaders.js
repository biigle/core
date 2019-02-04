biigle.$component('videos.components.trackHeaders', {
    template: '<div class="track-headers">' +
        '<div class="track-header" v-for="track in tracks">'+
            '<div' +
                ' class="label-name"' +
                ' v-text="track.label.name"' +
                ' :title="track.label.name"' +
                '></div>' +
            '<div class="lane-dummy" v-for="lane in track.lanes"></div>' +
        '</div>' +
    '</div>',
    props: {
        tracks: {
            type: Array,
            required: true,
        },
        scrollTop: {
            type: Number,
            default: 0,
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
        //
    },
    watch: {
        scrollTop: function (scrollTop) {
            this.$el.scrollTop = scrollTop;
        },
    },
});
