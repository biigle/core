biigle.$component('components.currentTimeIndicator', {
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
    data: function () {
        return {
            parentWidth: 0,
        };
    },
    computed: {
        style: function () {
            if (this.duration > 0) {
                var offset = this.parentWidth * this.currentTime / this.duration;

                return 'transform: translateX(' + offset + 'px);';
            }
        },
    },
    methods: {
        updateParentWidth: function () {
            this.parentWidth = this.$el.parentElement.clientWidth;
        },
    },
    mounted: function () {
        this.updateParentWidth();
    },
});
