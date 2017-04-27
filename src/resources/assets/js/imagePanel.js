/**
 * The panel for editing volume images
 */
biigle.$viewModel('image-panel', function (element) {
    var messages = biigle.$require('messages.store');
    var volumeId = biigle.$require('volumes.id');

    var imageItem = {
        props: ['image'],
        computed: {
            classObject: function () {
                return {'list-group-item-success': this.image.isNew};
            },
            title: function () {
                return 'Delete image #' + this.image.id;
            },
        },
        methods: {
            remove: function () {
                this.$emit('remove', this.image);
            },
        }
    };

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            filenames: '',
            images: [],
            errors: {},
        },
        components: {
            imageItem: imageItem,
        },
        computed: {
            classObject: function () {
                return {'panel-warning panel--editing': this.editing};
            },
            orderedImages: function () {
                return this.images.sort(function (a, b) {
                    return a.filename < b.filename ? -1 : 1;
                });
            },
            hasImages: function () {
                return this.images.length > 0;
            },
        },
        methods: {
            startLoading: function () {
                this.errors = {};
                this.loading = true;
            },
            submit: function () {
                if (this.loading) return;

                this.startLoading();
                biigle.$require('api.volumes')
                    .saveImages({id: volumeId}, {images: this.filenames})
                        .then(this.imagesSaved)
                        .catch(this.handleErrorResponse)
                        .finally(this.finishLoading);
            },
            imagesSaved: function (response) {
                for (var i = response.data.length - 1; i >= 0; i--) {
                    response.data[i].isNew = true;
                    this.images.push(response.data[i]);
                }
                this.filenames = '';
            },
            handleRemove: function (image) {
                if (!this.loading && confirm('Do you really want to delete the image #' + image.id + ' (' + image.filename + ')? All annotations will be lost!')) {
                    this.startLoading();
                    var self = this;
                    biigle.$require('api.images').delete({id: image.id})
                        .then(function () {self.imageRemoved(image.id);})
                        .catch(messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            imageRemoved: function (id) {
                var images = this.images;
                for (var i = images.length - 1; i >= 0; i--) {
                    if (images[i].id === id) {
                        images.splice(i, 1);
                        return;
                    }
                }
            },
            handleErrorResponse: function (response) {
                if (response.status === 422) {
                    this.errors = response.data;
                } else {
                    messages.handleErrorResponse(response);
                }
            },
            hasError: function (name) {
                return this.errors.hasOwnProperty(name);
            },
            getError: function (name) {
                return this.errors[name];
            },
        },
        created: function () {
            var images = biigle.$require('volumes.images');
            for (var id in images) {
                if (!images.hasOwnProperty(id));
                this.images.push({id: id, filename: images[id]});
            }
        },
    });
});
