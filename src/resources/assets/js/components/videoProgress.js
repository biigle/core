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
                ' v-if="hasTicks"' +
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
            default() {
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
                style() {
                    return 'left: ' + (this.bookmark.time / this.$parent.duration * this.$parent.elementWidth) + 'px';
                },
            },
            methods: {
                emitSelect() {
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
                style() {
                    return 'left: ' + (this.time / this.$parent.duration * this.$parent.elementWidth) + 'px';
                },
                text() {
                    return Vue.filter('videoTime')(this.time);
                },
            },
        },
    },
    data() {
        return {
            tickSpacing: 100,
        };
    },
    computed: {
        tickCount() {
            return Math.floor(this.elementWidth / this.tickSpacing);
        },
        ticks() {
            let step = this.duration / this.tickCount;

            return Array.apply(null, {length: this.tickCount})
                .map(function (item, index) {
                    return step * index;
                });
        },
        hasTicks() {
            return this.tickCount > 0 && this.duration > 0;
        },
    },
    methods: {
        emitSeek(e) {
            this.$emit('seek', (e.clientX - e.target.getBoundingClientRect().left) / e.target.clientWidth * this.duration);
        },
        emitSelectBookmark(bookmark) {
            this.$emit('seek', bookmark.time);
        },
    },
    mounted() {
        //
    },
});
