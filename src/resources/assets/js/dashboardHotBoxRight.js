/**
 * The volume thumbnail of the dashboard hot box.
 */
biigle.$viewModel('volume-dashboard-hot-box-right', function (element) {
    new Vue({
        el: element,
        components: {
            volumeThumbnail: biigle.$require('projects.components.volumeThumbnail')
        }
    });
});
