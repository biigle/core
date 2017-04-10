/**
 * A variant of the image grid image used to display volume images
 *
 * @type {Object}
 */
biigle.$component('volumes.components.labelImageGridImage', {
    mixins: [biigle.$require('volumes.components.imageGridImage')],
    template: '<figure class="image-grid__image image-grid__image--label" :class="classObject">' +
        '<img @click="handleClick" :src="url || emptyUrl" @error="showEmptyImage">' +
        '<div class="image-buttons">' +
            '<a v-if="image.imageUrl" :href="image.imageUrl" class="image-button" title="Viev image information">' +
                '<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>' +
            '</a>' +
        '</div>' +
    '</figure>',
    data: function () {
        return {
            loading: false,
            success: null,
            attachedLabels: [],
            timeout: null,
        };
    },
    props: {
        selectedLabel: {
            type: Object,
            default: null,
        }
    },
    computed: {
        selectable: function () {
            return this.selectedLabel && !this.loading;
        },
        classObject: function () {
            return {
                'image-grid__image--selectable': this.selectable,
                'image-grid__image--loading': this.loading,
                'image-grid__image--success': this.success === true,
                'image-grid__image--error': this.success === false,
            };
        },
    },
    methods: {
        handleClick: function () {
            if (!this.selectable) {
                return;
            }

            this.loading = true;
            biigle.$require('api.imageLabels')
                .save({image_id: this.image.id}, {label_id: this.selectedLabel.id})
                .then(this.labelAttached, this.attachingFailed)
                .finally(this.resetSuccess);
        },
        labelAttached: function (response) {
            this.loading = false;
            this.success = true;
            this.attachedLabels.push(response.data);
        },
        attachingFailed: function (response) {
            this.loading = false;
            this.success = false;
            biigle.$require('messages.store').handleErrorResponse(response);
        },
        resetSuccess: function () {
            var self = this;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(function() {
                self.success = null;
            }, 3000);
        },
    },
});
