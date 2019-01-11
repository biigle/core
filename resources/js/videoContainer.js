biigle.$viewModel('video-container', function (element) {
    new Vue({
        el: element,
        components: {
            videoScreen: biigle.$require('components.videoScreen'),
        },
        data: {

        },
        computed: {

        },
        methods: {
            play: function () {
                this.$refs.videoScreen.play();
            },
            pause: function () {
                this.$refs.videoScreen.pause();
            },
        },
    });
});
