/**
 * A variant of the image grid image used for the relabel step of Largo
 *
 * @type {Object}
 */
biigle.$component('largo.components.relabelImageGridImage', {
    mixins: [biigle.$require('volumes.components.imageGridImage')],
    template: '<figure class="image-grid__image image-grid__image--relabel" :class="classObject" :title="title">' +
        '<div v-if="selectable" class="image-icon">' +
            '<i class="fas" :class="iconClass"></i>' +
        '</div>' +
        '<img @click="toggleSelect" :src="url || emptyUrl">' +
        '<div v-if="showAnnotationLink" class="image-buttons">' +
            '<a :href="showAnnotationLink" target="_blank" class="image-button" title="Show the annotation in the annotation tool">' +
                '<span class="fa fa-external-link-square-alt" aria-hidden="true"></span>' +
            '</a>' +
        '</div>' +
        '<div v-if="selected" class="new-label">' +
            '<span class="new-label__color" :style="newLabelStyle"></span> ' +
            '<span class="new-label__name" v-text="image.newLabel.name"></span>' +
        '</div>' +
    '</figure>',
    computed: {
        showAnnotationLink: function () {
            var route = biigle.$require('largo.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        selected: function () {
            return this.image.newLabel;
        },
        title: function () {
            return this.selected ? 'Revert changing the label of this annotation' : 'Change the label of this annotation';
        },
        newLabelStyle: function () {
            return {
                'background-color': '#' + this.image.newLabel.color,
            };
        },
    },
    methods: {
        getBlob: function () {
            return biigle.$require('largo.api.annotations').get({id: this.image.id});
        },
    },
});
