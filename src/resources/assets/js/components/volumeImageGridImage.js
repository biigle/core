/**
 * A variant of the image grid image used to display volume images
 *
 * @type {Object}
 */
biigle.$component('volumes.components.volumeImageGridImage', {
    mixins: [
        biigle.$require('volumes.components.imageGridImage'),
        biigle.$require('core.mixins.loader'),
    ],
    template: '<figure class="image-grid__image image-grid__image--volume" :class="classObject" :title="title">' +
        '<a v-if="!selectable && image.annotateUrl" :href="image.annotateUrl" title="Annotate this image" class="image-link">' +
            '<img :src="url || emptyUrl" @error="showEmptyImage">' +
        '</a>' +
        '<img v-else @click="handleClick" :src="url || emptyUrl" @error="showEmptyImage">' +
        '<span v-if="showFilename" class="image-filename" :title="image.filename" v-text="image.filename"></span>' +
        '<div class="image-buttons">' +
            '<a v-if="image.imageUrl" :href="image.imageUrl" class="image-button" title="View image information">' +
                '<span class="fa fa-info-circle" aria-hidden="true"></span>' +
            '</a>' +
        '</div>' +
        '<div v-if="showLabels" class="image-labels" @wheel.stop>' +
            '<image-label-list :image-labels="image.labels" :user-id="userId" :is-admin="isAdmin" @deleted="removeImageLabel"></image-label-list>' +
        '</div>' +
    '</figure>',
    components: {
        imageLabelList: biigle.$require('volumes.components.imageLabelList'),
    },
    data: function () {
        return {
            attachingSuccess: null,
            timeout: null,
            saving: false,
        };
    },
    props: {
        selectedLabel: {
            type: Object,
            default: null,
        },
        showFilename: {
            type: Boolean,
            default: false,
        },
        showLabels: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        userId: function () {
            return biigle.$require('volumes.userId');
        },
        isAdmin: function () {
            return biigle.$require('volumes.isAdmin');
        },
        alreadyHasSelectedLabel: function () {
            var selected = this.selectedLabel;

            return this.image.labels.reduce(function (carry, item) {
                return carry || selected.id === item.label_id;
            }, false);
        },
        showAnnotationLink: function () {
            var route = biigle.$require('largo.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        selected: function () {
            return this.image.flagged;
        },
        canBeSelected: function () {
            return this.selectable && this.selectedLabel && !this.alreadyHasSelectedLabel && !this.saving;
        },
        classObject: function () {
            return {
                'image-grid__image--selected': this.selected,
                'image-grid__image--selectable': this.canBeSelected,
                'image-grid__image--saving': this.selectable && this.saving,
                'image-grid__image--success': this.attachingSuccess === true,
                'image-grid__image--error': this.attachingSuccess === false,
            };
        },
        title: function () {
            return this.canBeSelected ? 'Attach ' + this.selectedLabel.name : '';
        },
    },
    methods: {
        handleClick: function () {
            if (!this.canBeSelected) {
                return;
            }

            var self = this;
            this.saving = true;
            biigle.$require('api.imageLabels')
                .save({image_id: this.image.id}, {label_id: this.selectedLabel.id})
                .then(this.labelAttached, this.attachingFailed)
                .finally(this.resetSuccess)
                .finally(function () {self.saving = false;});
        },
        labelAttached: function (response) {
            this.attachingSuccess = true;
            this.image.labels.push(response.data);
        },
        attachingFailed: function (response) {
            this.attachingSuccess = false;
            biigle.$require('messages.store').handleErrorResponse(response);
        },
        resetSuccess: function () {
            var self = this;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(function() {
                self.attachingSuccess = null;
            }, 3000);
        },
        removeImageLabel: function (item) {
            var index = this.image.labels.indexOf(item);
            if (index !== -1) {
                this.image.labels.splice(index, 1);
            }
        }
    },
});
