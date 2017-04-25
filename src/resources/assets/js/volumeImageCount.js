/**
 * View model for the image count of the volume overview
 */
biigle.$viewModel('volume-image-count', function (element) {
    var imageIds = biigle.$require('volumes.imageIds');
    var events = biigle.$require('biigle.events');

    new Vue({
        el: element,
        data: {
            count: imageIds.length,
        },
        computed: {
            text: function () {
                if (this.count === imageIds.length) {
                    return this.count;
                }

                return this.count + ' of ' + imageIds.length;
            },
        },
        created: function () {
            var self = this;
            events.$on('volumes.images.count', function (count) {
                self.count = count;
            });
        },
    });
});
