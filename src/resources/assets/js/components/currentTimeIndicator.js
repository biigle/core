biigle.$component('videos.components.currentTimeIndicator', {
    template: '<span class="time-indicator" :style="style"></span>',
    props: {
        duration: {
            type: Number,
            required: true,
        },
        currentTime: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            parentWidth: 0,
        };
    },
    computed: {
        style() {
            if (this.duration > 0) {
                let offset = this.parentWidth * this.currentTime / this.duration;

                return 'transform: translateX(' + offset + 'px);';
            }
        },
    },
    methods: {
        updateParentWidth() {
            this.parentWidth = this.$el.parentElement.clientWidth;
        },
    },
    mounted() {
        this.updateParentWidth();
    },
});
