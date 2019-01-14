biigle.$component('components.videoProgress', {
    template: '<div class="video-progress" @click="emitSeek">' +
        '<span class="time-indicator" :style="indicatorStyle"></span>' +
    '</div>',
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
    data: function () {
        return {
            elementWidth: 0,
        };
    },
    computed: {
        indicatorStyle: function () {
            if (this.duration > 0) {
                var offset = this.elementWidth * this.currentTime / this.duration;

                return 'transform: translateX(' + offset + 'px);';
            }
        },
    },
    methods: {
        updateElementWidth: function () {
            this.elementWidth = this.$el.clientWidth;
        },
        emitSeek: function (e) {
            var percent = (e.clientX - e.target.getBoundingClientRect().left) / this.elementWidth;

            this.$emit('seek', percent * this.duration);
        },
    },
    mounted: function () {
        this.updateElementWidth();
        window.addEventListener('resize', this.updateElementWidth);
    },
});
