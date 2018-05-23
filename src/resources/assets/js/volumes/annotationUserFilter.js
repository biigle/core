/**
 * Annotation user filter for the volume overview filters.
 */
biigle.$require('volumes.stores.filters').push({
    id: 'annotationUser',
    label: 'annotations from user',
    help: "All images that (don't) contain one or more annotations from the given user.",
    listComponent: {
        mixins: [biigle.$require('volumes.components.filterListComponent')],
        data: function () {
            return {name: 'annotations from user'};
        },
    },
    selectComponent: {
        mixins: [biigle.$require('volumes.components.filterSelectComponent')],
        data: function () {
            return {
                placeholder: 'User name',
                typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.affiliation"></small>',
            };
        },
        created: function () {
            biigle.$require('api.volumes').queryUsers({id: this.volumeId})
                .then(this.parseUsernames, biigle.$require('messages.store').handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence: function (volumeId, user) {
        return biigle.$require('annotations.api.volumes')
            .queryImagesWithAnnotationFromUser({id: volumeId, user_id: user.id});
    }
});
