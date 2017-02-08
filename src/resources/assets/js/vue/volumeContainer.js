/**
 * View model for the main volume container
 */
biigle.$viewModel('volume-container', function (element) {
    var volumeId = biigle.$require('volumes.volumeId');
    var imageIds = biigle.$require('volumes.imageIds');
    var imageUuids = biigle.$require('volumes.imageUuids');
    var thumbUri = biigle.$require('volumes.thumbUri');
    var annotateUri = biigle.$require('volumes.annotateUri');
    var imageUri = biigle.$require('volumes.imageUri');

    new Vue({
        el: element,
        components: {
            imageGrid: biigle.$require('volumes.components.volumeImageGrid'),
        },
        data: {
            imageIds: imageIds,
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
            imagesToShow: function () {
                return this.images;
            },
        },
        methods: {
        },
    });
});
