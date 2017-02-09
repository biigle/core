/**
 * View model for the main volume container
 */
biigle.$viewModel('volume-container', function (element) {
    var imageIds = biigle.$require('volumes.imageIds');
    var imageUuids = biigle.$require('volumes.imageUuids');
    var thumbUri = biigle.$require('volumes.thumbUri');
    var annotateUri = biigle.$require('volumes.annotateUri');
    var imageUri = biigle.$require('volumes.imageUri');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            imageGrid: biigle.$require('volumes.components.volumeImageGrid'),
            filterTab: biigle.$require('volumes.components.filterTab'),
        },
        data: {
            imageIds: imageIds,
            filterSequence: imageIds,
            sortingSequence: imageIds,
            volumeId: biigle.$require('volumes.volumeId'),
        },
        computed: {
            images: function () {
                return this.imageIds.map(function (id) {
                    return {
                        id: id,
                        url: thumbUri.replace('{uuid}', imageUuids[id]),
                        annotateUrl: annotateUri.replace('{id}', id),
                        imageUrl: imageUri.replace('{id}', id),
                    };
                });
            },
            sortedImages: function () {
                // Map from image ID to index od sorted array.
                var map = {};
                var i;
                for (i = this.sortingSequence.length - 1; i >= 0; i--) {
                    map[this.sortingSequence[i]] = i;
                }

                // Create new array where each image is at its sorted index.
                var images = [];
                for (i = this.images.length - 1; i >= 0; i--) {
                    images[map[this.images[i].id]] = this.images[i];
                }

                return images;
            },
            imagesToShow: function () {
                var self = this;
                return this.sortedImages.filter(function (image) {
                    return self.filterSequence.indexOf(image.id) !== -1;
                });
            },
            hasFilterSequence: function () {
                return this.imageIds.length > this.filterSequence.length;
            },
        },
        methods: {
            handleSidebarToggle: function () {
                var self = this;
                this.$nextTick(function () {
                    this.$refs.imageGrid.$emit('resize');
                });
            },
            toggleLoading: function (loading) {
                this.loading = loading;
            },
            updateFilterSequence: function (sequence) {
                this.filterSequence = sequence;
            },
        },
    });
});
