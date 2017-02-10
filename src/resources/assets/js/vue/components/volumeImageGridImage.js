/**
 * A variant of the image grid image used to display volume images
 *
 * @type {Object}
 */
biigle.$component('volumes.components.volumeImageGridImage', {
    mixins: [biigle.$require('volumes.components.imageGridImage')],
    template: '<figure class="image-grid__image image-grid__image--volume" :class="classObject">' +
        '<a v-if="image.annotateUrl" :href="image.annotateUrl">' +
            '<img @click="toggleSelect" :src="url || emptyUrl" @error="showEmptyImage">' +
        '</a>' +
        '<img v-else @click="toggleSelect" :src="url || emptyUrl" @error="showEmptyImage">' +
        '<div class="image-buttons">' +
            '<a v-if="image.imageUrl" :href="image.imageUrl" class="image-button" title="Viev image information">' +
                '<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>' +
            '</a>' +
        '</div>' +
    '</figure>',
    computed: {
        showAnnotationLink: function () {
            var route = biigle.$require('largo.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        selected: function () {
            return this.image.flagged;
        },
    },
});
