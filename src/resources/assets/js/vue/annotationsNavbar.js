/**
 * View model for the annotator navbar
 */
biigle.$viewModel('annotations-navbar', function (element) {

    new Vue({
        el: element,
        data: {
            currentImageFilename: '',
            filenameMap: {},
        },
        methods: {
            updateFilename: function (id) {
                this.currentImageFilename = this.filenameMap[id];
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
            events.$on('images.change', this.updateFilename);
        },
    });
});
