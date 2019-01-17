biigle.$component('videos.components.videoProgress', {
    template: '<div class="video-progress" @click="emitSeek">' +
        '<bookmark v-for="mark in bookmarks"' +
            ' :bookmark="mark"' +
            ' @select="emitSelectBookmark"' +
            '></bookmark>' +
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
                    var offset = 100 * this.bookmark.time / this.$parent.duration;

                    return 'left: ' + offset + '%';
                },
            },
            methods: {
                emitSelect: function () {
                    this.$emit('select', this.bookmark);
                },
            },
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
