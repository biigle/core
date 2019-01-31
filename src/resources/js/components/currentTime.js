biigle.$component('videos.components.currentTime', {
    template:
    '<div' +
        ' class="current-time"' +
        ' :class="classObject"' +
        '>' +
            '<span' +
                ' v-text="currentTimeText"' +
                '></span> ' +
            '<span' +
                ' class="hover-time"' +
                ' v-show="showHoverTime"' +
                ' v-text="hoverTimeText"' +
                '></span>' +
    '</div>',
    props: {
        currentTime: {
            type: Number,
            required: true,
        },
        hoverTime: {
            type: Number,
            default: 0,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            //
        };
    },
    computed: {
        currentTimeText: function () {
            return Vue.filter('videoTime')(this.currentTime);
        },
        hoverTimeText: function () {
            return Vue.filter('videoTime')(this.hoverTime);
        },
        classObject: function () {
            return {
                'current-time--seeking': this.seeking,
                'current-time--hover': this.showHoverTime,
            };
        },
        showHoverTime: function () {
            return this.hoverTime !== 0;
        },
    },
    methods: {
        //
    },
    watch: {
        //
    },
});
