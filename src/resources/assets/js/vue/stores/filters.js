/**
 * Store for the volume image filters
 */
biigle.$declare('volumes.stores.filters', [
    // default filters
    {
        id: 'imageLabels',
        label: 'image labels',
        help: "All images that (don't) have image labels attached.",
        listComponent: {
            mixins: [biigle.$require('volumes.components.filterListComponent')],
            data: function () {
                return {name: 'image labels'};
            },
        },
        getSequence: function (volumeId) {
            return biigle.$require('api.volumes').queryImagesWithImageLabels({
                id: volumeId,
            });
        }
    },
    {
        id: 'imageLabel',
        label: 'image label',
        help: "All images that (don't) have the given image label attached.",
        listComponent: {
            mixins: [biigle.$require('volumes.components.filterListComponent')],
            data: function () {
                return {name: 'image label'};
            },
        },
        selectComponent: {
            mixins: [biigle.$require('volumes.components.filterSelectComponent')],
            data: function () {
                return {
                    placeholder: 'Label name',
                };
            },
            created: function () {
                biigle.$require('api.volumes').queryImageLabels({id: this.volumeId})
                    .then(this.gotItems, biigle.$require('messages.store').handleErrorResponse);
            },
        },
        getSequence: function (volumeId, label) {
            return biigle.$require('api.volumes').queryImagesWithImageLabel({
                id: volumeId,
                label_id: label.id,
            });
        }
    }
]);
