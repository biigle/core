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
        '<a v-if="!labelMode && image.annotateUrl" :href="image.annotateUrl" title="Annotate this image">' +
            '<img :src="url || emptyUrl" @error="showEmptyImage">' +
        '</a>' +
        '<img v-else @click="handleClick" :src="url || emptyUrl" @error="showEmptyImage">' +
        '<div class="image-buttons">' +
            '<a v-if="image.imageUrl" :href="image.imageUrl" class="image-button" title="View image information">' +
                '<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>' +
            '</a>' +
            '<button @click="toggleImageLabels" class="image-button" title="Show image labels">' +
                '<loader v-if="!imageLabelsLoaded" :active="loading"></loader>' +
                '<span v-if="!loading" class="glyphicon glyphicon-tag" aria-hidden="true"></span>' +
            '</button>' +
        '</div>' +
        '<div v-if="imageLabelsLoaded && showImageLabels" class="image-labels" @wheel.stop>' +
            '<image-label-list :image-labels="imageLabels" @deleted="removeImageLabel"></image-label-list>' +
        '</div>' +
    '</figure>',
    components: {
        imageLabelList: biigle.$require('volumes.components.imageLabelList'),
    },
    data: function () {
        return {
            showImageLabels: false,
            imageLabels: [],
            imageLabelsLoaded: false,
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
        labelMode: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        alreadyHasSelectedLabel: function () {
            for (var i = this.imageLabels.length - 1; i >= 0; i--) {
                if (this.imageLabels[i].label.id === this.selectedLabel.id) {
                    return true;
                }
            }

            return false;
        },
        showAnnotationLink: function () {
            var route = biigle.$require('largo.showAnnotationRoute');
            return route ? (route + this.image.id) : '';
        },
        selected: function () {
            return this.image.flagged;
        },
        selectable: function () {
            return this.labelMode && this.selectedLabel && !this.alreadyHasSelectedLabel && !this.saving;
        },
        classObject: function () {
            return {
                'image-grid__image--selected': this.selected,
                'image-grid__image--selectable': this.selectable,
                'image-grid__image--saving': this.labelMode && this.saving,
                'image-grid__image--success': this.attachingSuccess === true,
                'image-grid__image--error': this.attachingSuccess === false,
            };
        },
        title: function () {
            return this.selectable ? 'Attach ' + this.selectedLabel.name : '';
        },
    },
    methods: {
        toggleImageLabels: function () {
            this.showImageLabels = !this.showImageLabels;
            if (!this.imageLabelsLoaded && !this.loading) {
                this.loadImageLabels();
            }
        },
        loadImageLabels: function () {
            this.startLoading();
            biigle.$require('api.imageLabels').query({image_id: this.image.id})
                .then(this.loadedImageLabels, biigle.$require('messages.store').handleErrorResponse)
                .finally(this.finishLoading);
        },
        loadedImageLabels: function (response) {
            this.imageLabelsLoaded = true;
            this.imageLabels = response.data;
        },
        handleClick: function () {
            if (!this.selectable) {
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
            this.imageLabels.push(response.data);
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
            for (var i = this.imageLabels.length - 1; i >= 0; i--) {
                if (this.imageLabels[i].id === item.id) {
                    this.imageLabels.splice(i, 1);
                    return;
                }
            }
        }
    },
});
