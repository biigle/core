biigle.$viewModel('search-results', function (element) {
    new Vue({
        el: element,
        components: {previewThumbnail: biigle.$require('projects.components.previewThumbnail')}
    });
});
