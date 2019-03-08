biigle.$viewModel('search-results', function (element) {
    new Vue({
        el: element,
        components: {videoThumbnail: biigle.$require('videos.components.videoThumbnail')}
    });
});
