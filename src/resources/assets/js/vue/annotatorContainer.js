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
            imageIndex: null,
            image: null,
            annotations: [],
            annotationFilter: null,
            // Initial map viewport.
            mapCenter: undefined,
            mapResolution: undefined,
            selectedLabel: null,
        },
        computed: {
            imageId: function () {
                return imagesIds[this.imageIndex];
            },
            selectedAnnotations: function () {
                return this.annotations.filter(function (annotation) {
                    return annotation.selected;
                });
            },
            hasAnnotationFilter: function () {
                return typeof this.annotationFilter === 'function';
            },
            filteredAnnotations: function () {
                if (this.hasAnnotationFilter) {
                    return this.annotations.filter(this.annotationFilter);
                }

                return this.annotations;
            },
        },
        methods: {
            getImageAndAnnotationsPromises: function () {
                return [
                    imagesStore.fetchImage(this.imageId),
                    annotationsStore.fetchAnnotations(this.imageId),
                ];
            },
            setCurrentImageAndAnnotations: function (args) {
                this.image = args[0];
                this.annotations = args[1];
            },
            updateUrlSlug: function () {
                urlParams.setSlug(this.imageId);
            },
            getNextIndex: function (index) {
                return (index + 1) % imagesIds.length;
            },
            getPreviousIndex: function (index) {
                return (index + imagesIds.length - 1) % imagesIds.length;
            },
            nextImage: function () {
                if (!this.loading) {
                    this.imageIndex = this.getNextIndex(this.imageIndex);
                }
            },
            previousImage: function () {
                if (!this.loading) {
                    this.imageIndex = this.getPreviousIndex(this.imageIndex);
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

                this.annotations.forEach(function (a) {
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

                this.$refs.annotationsTab.scrollIntoView(this.selectedAnnotations);
            },
            handleDeselectAnnotation: function (annotation, event) {
                if (event && event.shiftKey) {
                    annotation.selected = false;
                    return;
                }

                this.annotations.forEach(function (a) {
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
                    var annotations = this.annotations;
                    for (var i = annotations.length - 1; i >= 0; i--) {
                        if (annotations[i].id === id) {
                            this.handleFocusAnnotation(annotations[i]);
                            annotations[i].selected = true;
                            return;
                        }
                    }
                }
            },
            handleFilter: function (filter) {
                this.annotationFilter = filter;
            },
            handleSelectedLabel: function (label) {
                this.selectedLabel = label;
            },
        },
        watch: {
            imageIndex: function (index) {
                var previousId = imagesIds[this.getPreviousIndex(index)];
                var nextId = imagesIds[this.getNextIndex(index)];
                events.$emit('images.change', this.imageId, previousId, nextId);
                this.startLoading();
                Vue.Promise.all(this.getImageAndAnnotationsPromises())
                    .then(this.setCurrentImageAndAnnotations)
                    .then(this.updateUrlSlug)
                    .then(this.maybeSelectAndFocusAnnotation)
                    .then(this.finishLoading);
            },
        },
        created: function () {
            this.startLoading();
            this.imageIndex = imagesIds.indexOf(biigle.$require('annotations.imageId'));

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
