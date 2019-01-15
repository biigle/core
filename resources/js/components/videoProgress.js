biigle.$component('components.videoProgress', {
    template: '<div class="video-progress" @click="emitSeek">' +

    '</div>',
    props: {
        duration: {
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
        emitSeek: function (e) {
            this.$emit('seek', e.clientX - e.target.getBoundingClientRect().left);
        },
    },
    mounted: function () {
        //
    },
});
