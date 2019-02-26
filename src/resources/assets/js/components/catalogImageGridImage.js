/**
 * A variant of the image grid image used for the annotation catalog
 *
 * @type {Object}
 */
biigle.$component('largo.components.catalogImageGridImage', {
    mixins: [
        biigle.$require('volumes.components.imageGridImage'),
        biigle.$require('largo.mixins.annotationPatch'),
    ],
    template: '<figure class="image-grid__image image-grid__image--catalog" :class="classObject">' +
        '<a v-if="showAnnotationLink" :href="showAnnotationLink" target="_blank" title="Show the annotation in the annotation tool">' +
            '<img :src="url || emptyUrl" @error="showEmptyImage">' +
        '</a>' +
        '<img v-else :src="url || emptyUrl" @error="showEmptyImage">' +
    '</figure>',
    computed: {
        showAnnotationLink: function () {
            var route = biigle.$require('annotationCatalog.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        id: function () {
            return this.image.id;
        },
        uuid: function () {
            return this.image.uuid;
        },
        urlTemplate: function () {
            return biigle.$require('largo.patchUrlTemplate');
        },
    },
});
