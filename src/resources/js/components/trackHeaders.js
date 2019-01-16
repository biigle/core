biigle.$component('components.trackHeaders', {
    template: '<div class="track-headers">' +
        '<div class="track-header" v-for="track in tracks">'+
            '<div class="label-name" v-text="track.label.name"></div>' +
            '<div class="lane-dummy" v-for="lane in track.lanes"></div>' +
        '</div>' +
    '</div>',
    props: {
        labels: {
            type: Object,
            required: true,
        },
        laneCounts: {
            type: Object,
            default: function () {
                return {};
            },
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
        tracks: function () {
            return Object.keys(this.laneCounts).map(function (labelId) {
                return {
                    label: this.labels[labelId],
                    lanes: Array.apply(null, {length: this.laneCounts[labelId]}),
                };
            }, this);
        },
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
