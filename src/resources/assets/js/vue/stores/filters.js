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
    },
    {
        id: 'imageLabelUser',
        label: 'image label from user',
        help: "All images that (don't) have one or more image labels attached by the given user.",
        listComponent: {
            mixins: [biigle.$require('volumes.components.filterListComponent')],
            data: function () {
                return {name: 'image label from user'};
            },
        },
        selectComponent: {
            mixins: [biigle.$require('volumes.components.filterSelectComponent')],
            data: function () {
                return {
                    placeholder: 'User name',
                };
            },
            created: function () {
                biigle.$require('api.volumes').queryUsers({id: this.volumeId})
                    .then(this.parseUsernames, biigle.$require('messages.store').handleErrorResponse)
                    .then(this.gotItems);
            },
        },
        getSequence: function (volumeId, user) {
            return biigle.$require('api.volumes').queryImagesWithImageLabelFromUser({
                id: volumeId,
                user_id: user.id,
            });
        }
    }
]);
