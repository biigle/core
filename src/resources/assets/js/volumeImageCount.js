/**
 * View model for the image count of the volume overview
 */
biigle.$viewModel('volume-image-count', function (element) {
    var imageIds = biigle.$require('volumes.imageIds');
    var events = biigle.$require('events');

    new Vue({
        el: element,
        computed: {
            count: function () {
                return biigle.$require('volumes.stores.image').count;
            },
            text: function () {
                if (this.count === imageIds.length) {
                    return this.count;
                }

                return this.count + ' of ' + imageIds.length;
            },
        },
    });
});
