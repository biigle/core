/**
 * A variant of the image grid image used for the dismiss step of Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.dismissImageGridImage', {
    mixins: [biigle.$require('volumes.components.imageGridImage')],
    template: '<figure class="image-grid__image" :class="classObject" :title="title">' +
        '<div v-if="selectable" class="image-icon">' +
            '<i class="fas fa-3x" :class="iconClass"></i>' +
        '</div>' +
        '<img @click="toggleSelect" :src="url || emptyUrl">' +
        '<div v-if="showAnnotationLink" class="image-buttons">' +
            '<a :href="showAnnotationLink" target="_blank" class="image-button" title="Show the annotation in the annotation tool">' +
                '<span class="fa fa-external-link-square-alt" aria-hidden="true"></span>' +
            '</a>' +
        '</div>' +
    '</figure>',
    computed: {
        showAnnotationLink: function () {
            var route = biigle.$require('largo.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        selected: function () {
            return this.image.dismissed;
        },
        title: function () {
            return this.selected ? 'Undo dismissing this annotation' : 'Dismiss this annotation';
        },
    },
    methods: {
        getBlob: function () {
            return biigle.$require('largo.api.annotations').get({id: this.image.id});
        },
    },
});
