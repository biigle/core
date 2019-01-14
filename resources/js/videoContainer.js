biigle.$viewModel('video-container', function (element) {
    var VIDEO_SRC = biigle.$require('videoSrc');

    new Vue({
        el: element,
        components: {
            videoScreen: biigle.$require('components.videoScreen'),
            videoTimeline: biigle.$require('components.videoTimeline'),
        },
        data: {
            video: document.createElement('video'),
        },
        computed: {

        },
        methods: {
            seek: function (time) {
                this.video.currentTime = time;
            },
        },
        created: function () {
            this.video.muted = true;
        },
        mounted: function () {
            // Wait for the sub-components to register their event listeners before
            // loading the video.
            this.video.src = VIDEO_SRC;
        },
    });
});
