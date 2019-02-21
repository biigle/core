/**
 * Annotation label filter for the volume overview filters.
 */
if (Array.isArray(biigle.$require('volumes.stores.filters'))) {
    biigle.$require('volumes.stores.filters').push({
        id: 'annotationLabels',
        label: 'annotation with label',
        help: "All images that (don't) contain one or more annotations with the given label.",
        listComponent: {
            mixins: [biigle.$require('volumes.components.filterListComponent')],
            data: function () {
                return {name: 'annotation with label'};
            },
        },
        selectComponent: {
            mixins: [biigle.$require('volumes.components.filterSelectComponent')],
            components: {
                typeahead: biigle.$require('labelTrees.components.labelTypeahead'),
            },
            data: function () {
                return {
                    placeholder: 'Label name',
                };
            },
            created: function () {
                biigle.$require('annotations.api.volumes')
                    .queryAnnotationLabels({id: this.volumeId})
                    .then(this.gotItems, biigle.$require('messages.store').handleErrorResponse);
            },
        },
        getSequence: function (volumeId, label) {
            return biigle.$require('annotations.api.volumes')
                .queryImagesWithAnnotationLabel({id: volumeId, label_id: label.id});
        }
    });
}
