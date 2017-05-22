/**
 * A mixin that keeps track of the current image filename
 *
 * @type {Object}
 */
biigle.$component('annotations.mixins.imageFilenameTracker', {
    data: function () {
        return {
            filenameMap: {},
            currentImageId: null,
            defaultFilename: '',
        };
    },
    computed: {
        currentImageFilename: function () {
            return this.filenameMap[this.currentImageId] || this.defaultFilename;
        },
    },
    methods: {
        updateImageId: function (id) {
            this.currentImageId = id;
        },
    },
    created: function () {
        var events = biigle.$require('events');
        var imagesIds = biigle.$require('annotations.imagesIds');
        var imagesFilenames = biigle.$require('annotations.imagesFilenames');
        var map = this.filenameMap;

        imagesIds.forEach(function (id, index) {
            map[id] = imagesFilenames[index];
        });
        events.$on('images.change', this.updateImageId);
    },
});
