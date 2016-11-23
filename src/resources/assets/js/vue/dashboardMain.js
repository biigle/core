/**
 * The (favourite) project list on the dashboard.
 */
biigle.$viewModel('projects-dashboard-main', function (element) {
    new Vue({
        el: element,
        components: {
            transectThumbnail: biigle.projects.components.transectThumbnail
        }
    });
});
