biigle.$viewModel('search-results', function (element) {
    new Vue({
        el: element,
        components: {volumeThumbnail: biigle.$require('projects.components.volumeThumbnail')}
    });
});
