/**
 * View model for the annotator navbar
 */
biigle.$viewModel('annotations-navbar', function (element) {

    new Vue({
        el: element,
        mixins: [biigle.$require('annotations.mixins.imageFilenameTracker')],
        data: {
            // Take the pre-filled content of the element when the page is initially
            // loaded until the image id has been set. Otherwise the filename would
            // vanish and appear again what we don't want.
            defaultFilename: element.innerHTML,
            imageIdsToSee: biigle.$require('annotations.imagesIds').slice(),
        },
        watch: {
            currentImageId: function (id) {
                var ids = this.imageIdsToSee;
                for (var i = ids.length - 1; i >= 0; i--) {
                    if (ids[i] === id) {
                        ids.splice(i, 1);
                        break;
                    }
                }
            },
            imageIdsToSee: function (ids) {
                if (ids.length === 0) {
                    biigle.$require('messages.store').info('You have now seen all images of this batch.');
                }
            },
            currentImageFilename: function (filename) {
                document.title = 'Annotate ' + filename;
            },
        },
        created: function () {
            var self = this;
            biigle.$require('events').$on('images.sequence', function (ids) {
                self.imageIdsToSee = ids.slice();
            });
        },
    });
});
