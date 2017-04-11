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
            labelsTab: biigle.$require('volumes.components.labelsTab'),
        },
        data: {
            imageIds: imageIds,
            images: [],
            filterSequence: imageIds,
            sortingSequence: imageIds,
            volumeId: biigle.$require('volumes.volumeId'),
            filterMode: null,
            imageLabelMode: false,
        },
        computed: {
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

                if (this.filterMode === 'flag') {
                    return this.sortedImages.map(function (image) {
                        image.flagged = self.filterSequence.indexOf(image.id) !== -1;
                        return image;
                    });
                }

                return this.sortedImages.filter(function (image) {
                    image.flagged = false;
                    return self.filterSequence.indexOf(image.id) !== -1;
                });
            },
            imageIdsToShow: function () {
                return this.imagesToShow.map(function (image) {
                    return image.id;
                });
            },
            hasFilterSequence: function () {
                return this.imageIds.length > this.filterSequence.length;
            },
            imagesStorageKey: function () {
                return 'biigle.volumes.' + this.volumeId + '.images';
            },
        },
        methods: {
            handleSidebarToggle: function () {
                var self = this;
                this.$nextTick(function () {
                    this.$refs.imageGrid.$emit('resize');
                });
            },
            handleSidebarOpen: function (tab) {
                this.imageLabelMode = tab === 'labels';
            },
            handleSidebarClose: function (tab) {
                this.imageLabelMode = false;
            },
            toggleLoading: function (loading) {
                this.loading = loading;
            },
            updateFilterSequence: function (data) {
                this.filterSequence = data.sequence;
                this.filterMode = data.mode;
            },
        },
        watch: {
            imageIdsToShow: function () {
                // If the shown images differ from the default sequence, store them for
                // the annotation tool.
                var equal = this.imageIdsToShow.length === this.imageIds.length;

                if (equal) {
                    for (var i = this.imageIdsToShow.length - 1; i >= 0; i--) {
                        if (this.imageIdsToShow[i] !== this.imageIds[i]) {
                            equal = false;
                            break;
                        }
                    }
                }

                if (equal) {
                    localStorage.removeItem(this.imagesStorageKey);
                } else {
                    localStorage.setItem(
                        this.imagesStorageKey,
                        JSON.stringify(this.imageIdsToShow)
                    );
                }
            },
        },
        created: function () {
            // Do this here instead of a computed property so the image objects get
            // reactive. Also, this array does never change between page reloads.
            var images = this.imageIds.map(function (id) {
                return {
                    id: id,
                    url: thumbUri.replace('{uuid}', imageUuids[id]),
                    annotateUrl: annotateUri.replace('{id}', id),
                    imageUrl: imageUri.replace('{id}', id),
                    flagged: false,
                };
            });

            Vue.set(this, 'images', images);
        },
    });
});
