/**
 * View model for the annotator navbar
 */
biigle.$viewModel('annotations-navbar', function (element) {

    new Vue({
        el: element,
        data: {
            filenameMap: {},
            currentImageId: null,
        },
        computed: {
            currentImageFilename: function () {
                // Take the pre-filled content of the element when the page is initially
                // loaded until the image id has been set. Otherwise the filename would
                // vanish and appear again what we don't want.
                return this.filenameMap[this.currentImageId] || element.innerHTML;
            },
        },
        methods: {
            updateId: function (id) {
                this.currentImageId = id;
            },
        },
        watch: {
            currentImageFilename: function (filename) {
                document.title = 'Annotate ' + filename;
            },
        },
        created: function () {
            var events = biigle.$require('biigle.events');
            var imagesIds = biigle.$require('annotations.imagesIds');
            var imagesFilenames = biigle.$require('annotations.imagesFilenames');
            var map = this.filenameMap;

            imagesIds.forEach(function (id, index) {
                map[id] = imagesFilenames[index];
            });
            events.$on('images.change', this.updateId);
        },
    });
});
