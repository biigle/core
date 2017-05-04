/**
 * View model for the annotator container
 */
biigle.$viewModel('annotator-container', function (element) {
    var events = biigle.$require('biigle.events');
    var imagesIds = biigle.$require('annotations.imagesIds');
    var imagesStore = biigle.$require('annotations.stores.images');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('annotations.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            labelsTab: biigle.$require('annotations.components.labelsTab'),
            annotationCanvas: biigle.$require('annotations.components.annotationCanvas'),
        },
        data: {
            currentImageIndex: 0,
            // Initialize with empty canvas until the first image has been loaded.
            currentImage: document.createElement('canvas'),
        },
        computed: {
            currentImageId: function () {
                return imagesIds[this.currentImageIndex];
            },
            currentImagePromise: function () {
                return imagesStore.fetchImage(this.currentImageId);
            },
        },
        methods: {
            setCurrentImage: function (image) {
                this.currentImage = image;
            },
            getNextIndex: function (index) {
                return (index + 1) % imagesIds.length;
            },
            getPreviousIndex: function (index) {
                return (index + imagesIds.length - 1) % imagesIds.length;
            },
            nextImage: function () {
                if (!this.loading) {
                    this.currentImageIndex = this.getNextIndex(this.currentImageIndex);
                }
            },
            previousImage: function () {
                if (!this.loading) {
                    this.currentImageIndex = this.getPreviousIndex(this.currentImageIndex);
                }
            },
        },
        watch: {
            currentImageIndex: function (index) {
                var previousId = imagesIds[this.getPreviousIndex(index)];
                var nextId = imagesIds[this.getNextIndex(index)];
                events.$emit('images.change', this.currentImageId, previousId, nextId);
                this.startLoading();
                this.currentImagePromise.then(this.setCurrentImage);
                Vue.Promise.all([this.currentImagePromise]).then(this.finishLoading);
            },
        },
        created: function () {
            this.startLoading();
            var keyboard = biigle.$require('labelTrees.stores.keyboard');

            keyboard.on(37, this.previousImage);
            keyboard.on(32, this.nextImage);
            keyboard.on(39, this.nextImage);

            this.currentImageIndex = imagesIds.indexOf(biigle.$require('annotations.imageId'));
        },
    });
});
