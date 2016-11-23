/**
 * The transect thumbnail of the dashboard hot box.
 */
biigle.$viewModel('transect-dashboard-hot-box-right', function (element) {
    new Vue({
        el: element,
        components: {
            transectThumbnail: biigle.projects.components.transectThumbnail
        }
    });
});
