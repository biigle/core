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
        },
        watch: {
            currentImageFilename: function (filename) {
                document.title = 'Annotate ' + filename;
            },
        },
    });
});
