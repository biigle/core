/**
 * View model for the main volume container
 */
biigle.$viewModel('volume-container', function (element) {
    var imageIds = biigle.$require('volumes.imageIds');
    var imageUuids = biigle.$require('volumes.imageUuids');
    var thumbUri = biigle.$require('volumes.thumbUri');
    var annotateUri = biigle.$require('volumes.annotateUri');
    var imageUri = biigle.$require('volumes.imageUri');
    var events = biigle.$require('events');
    var urlParams = biigle.$require('volumes.urlParams');

    /*
     * ABOUT PERFORMANCE
     *
     * Calling this.xxx on a Vue model inside a for loop is very slow because each call
     * must pass through the reactive getter functions! To mitigate this we use the
     * forEach method or set local variables wherever we can.
     */
    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            imageGrid: biigle.$require('volumes.components.volumeImageGrid'),
            filterTab: biigle.$require('volumes.components.filterTab'),
            sortingTab: biigle.$require('volumes.components.sortingTab'),
            labelsTab: biigle.$require('volumes.components.labelsTab'),
        },
        data: {
            imageIds: imageIds,
            images: [],
            filterSequence: imageIds,
            filterMode: null,
            filterActive: false,
            sortingSequence: imageIds,
            sortingActive: false,
            volumeId: biigle.$require('volumes.volumeId'),
            imageLabelMode: false,
            selectedLabel: null,
        },
        computed: {
            // Map from image ID to index of sorted array to compute sortedImages fast.
            sortingMap: function () {
                var map = {};
                this.sortingSequence.forEach(function (value, index) {
                    map[value] = index;
                });

                return map;
            },
            sortedImages: function () {
                // Create new array where each image is at its sorted index.
                var map = this.sortingMap;
                var images = [];
                this.images.forEach(function (image) {
                    images[map[image.id]] = image;
                });

                return images;
            },
            // Datastructure to make the filtering in imagesToShow more performant.
            filterMap: function () {
                var map = {};
                this.filterSequence.forEach(function (i) {
                    map[i] = null;
                });

                return map;
            },
            imagesToShow: function () {
                var map = this.filterMap;

                if (this.filterMode === 'flag') {
                    return this.sortedImages.map(function (image) {
                        image.flagged = map.hasOwnProperty(image.id);
                        return image;
                    });
                }

                return this.sortedImages.filter(function (image) {
                    image.flagged = false;
                    return map.hasOwnProperty(image.id);
                });
            },
            imageIdsToShow: function () {
                return this.imagesToShow.map(function (image) {
                    return image.id;
                });
            },
            imagesStorageKey: function () {
                return 'biigle.volumes.' + this.volumeId + '.images';
            },
            offsetStorageKey: function () {
                return 'biigle.volumes.' + this.volumeId + '.offset';
            },
            initialOffset: function () {
                return parseInt(urlParams.get('offset')) ||
                    parseInt(localStorage.getItem(this.offsetStorageKey)) ||
                    0;
            },
            filterEmpty: function () {
                return this.filterActive && this.filterSequence.length === 0;
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
            updateFilterSequence: function (sequence, mode, active) {
                this.filterSequence = sequence;
                this.filterMode = mode;
                this.filterActive = active;
            },
            handleImageGridScroll: function (offset) {
                if (offset > 0) {
                    urlParams.set({offset: offset});
                    localStorage.setItem(this.offsetStorageKey, offset);
                } else {
                    urlParams.unset('offset');
                    localStorage.removeItem(this.offsetStorageKey);
                }
            },
            handleSelectedLabel: function (label) {
                this.selectedLabel = label;
            },
            handleDeselectedLabel: function (label) {
                this.selectedLabel = null;
            },
            updateSortingSequence: function (sequence, active) {
                this.sortingSequence = sequence;
                this.sortingActive = active;
            },
            transformUuid: function (uuid) {
                return uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid;
            },
        },
        watch: {
            imageIdsToShow: function (imageIdsToShow) {
                // If the shown images differ from the default sequence, store them for
                // the annotation tool.
                var imageIds = this.imageIds;
                var equal = imageIdsToShow.length === imageIds.length;

                if (equal) {
                    for (var i = imageIdsToShow.length - 1; i >= 0; i--) {
                        if (imageIdsToShow[i] !== imageIds[i]) {
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
                        JSON.stringify(imageIdsToShow)
                    );
                }

                events.$emit('volumes.images.count', imageIdsToShow.length);
            },
        },
        created: function () {
            var self = this;
            // Do this here instead of a computed property so the image objects get
            // reactive. Also, this array does never change between page reloads.
            var images = this.imageIds.map(function (id) {
                return {
                    id: id,
                    url: thumbUri.replace('{uuid}', self.transformUuid(imageUuids[id])),
                    annotateUrl: annotateUri.replace('{id}', id),
                    imageUrl: imageUri.replace('{id}', id),
                    flagged: false,
                };
            });

            Vue.set(this, 'images', images);
        },
    });
});
