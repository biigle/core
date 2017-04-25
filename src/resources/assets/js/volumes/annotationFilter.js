/**
 * Annotations filter for the volume overview filters.
 */
biigle.$require('volumes.stores.filters').push({
    id: 'annotations',
    label: 'annotations',
    help: "All images that (don't) contain annotations.",
    listComponent: biigle.$require('volumes.components.filterListComponent'),
    getSequence: function (volumeId) {
        return biigle.$require('annotations.api.volumes').queryImagesWithAnnotations({
            id: volumeId,
        });
    }
});
