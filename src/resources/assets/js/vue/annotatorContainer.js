/**
 * View model for the annotator container
 */
biigle.$viewModel('annotator-container', function (element) {
    var events = biigle.$require('biigle.events');
    var imagesIds = biigle.$require('annotations.imagesIds');
    var imagesStore = biigle.$require('annotations.stores.images');
    var annotationsStore = biigle.$require('annotations.stores.annotations');
    var urlParams = biigle.$require('volumes.urlParams');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('annotations.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            labelsTab: biigle.$require('annotations.components.labelsTab'),
            annotationsTab: biigle.$require('annotations.components.annotationsTab'),
            annotationCanvas: biigle.$require('annotations.components.annotationCanvas'),
        },
        data: {
            currentImageIndex: null,
            currentImage: null,
            currentAnnotations: [],
            // Initial map viewport.
            mapCenter: undefined,
            mapResolution: undefined,
        },
        computed: {
            currentImageId: function () {
                return imagesIds[this.currentImageIndex];
            },
            currentImagePromise: function () {
                return imagesStore.fetchImage(this.currentImageId);
            },
            currentAnnotationsPromise: function () {
                return annotationsStore.fetchAnnotations(this.currentImageId);
            },
            currentSelectedAnnotations: function () {
                return this.currentAnnotations.filter(function (annotation) {
                    return annotation.selected;
                });
            },
        },
        methods: {
            setCurrentImageAndAnnotations: function (args) {
                this.currentImage = args[0];
                this.currentAnnotations = args[1];
            },
            updateUrlSlug: function () {
                urlParams.setSlug(this.currentImageId);
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
            handleMapMoveend: function (viewport) {
                this.mapCenter = viewport.center;
                this.mapResolution = viewport.resolution;
                urlParams.set({
                    r: Math.round(viewport.resolution * 100),
                    x: Math.round(viewport.center[0]),
                    y: Math.round(viewport.center[1]),
                });
            },
            // Handler for the select event fired by the global event bus.
            handleSelectAnnotation: function (annotation, event) {
                if (event && event.shiftKey) {
                    annotation.selected = true;
                    return;
                }

                this.currentAnnotations.forEach(function (a) {
                    a.selected = annotation.id === a.id;
                });
            },
            // Handler for the select event fired by the annotation-canvas component.
            handleSelectAnnotations: function (selected, deselected) {
                selected.forEach(function (annotation) {
                    annotation.selected = true;
                });

                deselected.forEach(function (annotation) {
                    annotation.selected = false;
                });
            },
            handleDeselectAnnotation: function (annotation, event) {
                if (event && event.shiftKey) {
                    annotation.selected = false;
                    return;
                }

                this.currentAnnotations.forEach(function (a) {
                    a.selected = false;
                });
            },
            handleFocusAnnotation: function (annotation) {
                this.$refs.canvas.focusAnnotation(annotation);
            },
            maybeSelectAndFocusAnnotation: function () {
                var id = urlParams.get('annotation');
                if (id) {
                    id = parseInt(id);
                    var annotations = this.currentAnnotations;
                    for (var i = annotations.length - 1; i >= 0; i--) {
                        if (annotations[i].id === id) {
                            this.handleFocusAnnotation(annotations[i]);
                            annotations[i].selected = true;
                            return;
                        }
                    }
                }
            },
        },
        watch: {
            currentImageIndex: function (index) {
                var previousId = imagesIds[this.getPreviousIndex(index)];
                var nextId = imagesIds[this.getNextIndex(index)];
                events.$emit('images.change', this.currentImageId, previousId, nextId);
                this.startLoading();
                Vue.Promise.all([this.currentImagePromise, this.currentAnnotationsPromise])
                    .then(this.setCurrentImageAndAnnotations)
                    .then(this.updateUrlSlug)
                    .then(this.maybeSelectAndFocusAnnotation)
                    .then(this.finishLoading);
            },
        },
        created: function () {
            this.startLoading();
            var keyboard = biigle.$require('labelTrees.stores.keyboard');

            keyboard.on(37, this.previousImage);
            keyboard.on(32, this.nextImage);
            keyboard.on(39, this.nextImage);

            this.currentImageIndex = imagesIds.indexOf(biigle.$require('annotations.imageId'));

            if (urlParams.get('r') !== undefined) {
                this.mapResolution = parseInt(urlParams.get('r'), 10) / 100;
            }

            if (urlParams.get('x') !== undefined && urlParams.get('y') !== undefined) {
                this.mapCenter = [
                    parseInt(urlParams.get('x'), 10),
                    parseInt(urlParams.get('y'), 10),
                ];
            }

            events.$on('annotations.select', this.handleSelectAnnotation);
            events.$on('annotations.deselect', this.handleDeselectAnnotation);
            events.$on('annotations.focus', this.handleFocusAnnotation);
        },
    });
});
