biigle.$component('videos.components.videoProgress', {
    template:
    '<div' +
        ' class="video-progress"' +
        ' @click="emitSeek"' +
        '>' +
            '<bookmark v-for="mark in bookmarks"' +
                ' :bookmark="mark"' +
                ' @select="emitSelectBookmark"' +
                '></bookmark>' +
            '<tick' +
                ' v-for="time in ticks"' +
                ' :time="time"' +
                '></tick>' +
    '</div>',
    props: {
        duration: {
            type: Number,
            required: true,
        },
        bookmarks: {
            type: Array,
            default: function () {
                return [];
            },
        },
        elementWidth: {
            type: Number,
            required: true,
        },
    },
    components: {
        bookmark: {
            template: '<span class="bookmark" :style="style" @click.stop="emitSelect"></span>',
            props: {
                bookmark: {
                    type: Object,
                    required: true,
                },
            },
            computed: {
                style: function () {
                    return 'left: ' + (this.bookmark.time / this.$parent.duration * this.$parent.elementWidth) + 'px';
                },
            },
            methods: {
                emitSelect: function () {
                    this.$emit('select', this.bookmark);
                },
            },
        },
        tick: {
            template: '<span class="tick" :style="style" v-text="text"></span>',
            props: {
                time: {
                    type: Number,
                    required: true,
                },
            },
            computed: {
                style: function () {
                    return 'left: ' + (100 * this.time / this.$parent.duration) + '%';
                },
                text: function () {
                    return Vue.filter('videoTime')(this.time);
                },
            },
        },
    },
    data: function () {
        return {
            tickSpacing: 100,
        };
    },
    computed: {
        ticks: function () {
            var count = Math.floor(this.elementWidth / this.tickSpacing);
            var step = this.duration / count;

            return Array.apply(null, {length: count})
                .map(function (item, index) {
                    return step * index;
                });
        },
    },
    methods: {
        emitSeek: function (e) {
            this.$emit('seek', (e.clientX - e.target.getBoundingClientRect().left) / e.target.clientWidth * this.duration);
        },
        emitSelectBookmark: function (bookmark) {
            this.$emit('seek', bookmark.time);
        },
    },
    mounted: function () {
        //
    },
});
