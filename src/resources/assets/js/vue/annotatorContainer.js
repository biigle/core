/**
 * View model for the annotator container
 */
biigle.$viewModel('annotator-container', function (element) {
    var events = biigle.$require('biigle.events');
    var imagesIds = biigle.$require('annotations.imagesIds');
    var imagesStore = biigle.$require('annotations.stores.images');
    var annotationsStore = biigle.$require('annotations.stores.annotations');
    var urlParams = biigle.$require('volumes.urlParams');
    var messages = biigle.$require('messages.store');
    var utils = biigle.$require('annotations.stores.utils');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('annotations.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            labelsTab: biigle.$require('annotations.components.labelsTab'),
            colorAdjustmentTab: biigle.$require('annotations.components.colorAdjustmentTab'),
            settingsTab: biigle.$require('annotations.components.settingsTab'),
            annotationsTab: biigle.$require('annotations.components.annotationsTab'),
            annotationCanvas: biigle.$require('annotations.components.annotationCanvas'),
        },
        data: {
            isEditor: biigle.$require('annotations.isEditor'),
            imageIndex: null,
            image: null,
            annotations: [],
            annotationFilter: null,
            lastCreatedAnnotation: null,
            lastCreatedAnnotationTimeout: null,
            annotationOpacity: 1,
            // Initial map viewport.
            mapCenter: undefined,
            mapResolution: undefined,
            selectedLabel: null,
            // Specifies what to cycle on the previous/next buttons or the arrow keys.
            // Default is the image, others can be annotations (Volare) or image
            // sections (lawnmower mode).
            cycleMode: 'default',
            // Index of the focussed annotation in the 'volare' cycle mode.
            focussedAnnotationIndex: null,
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
            supportsColorAdjustment: function () {
                return imagesStore.supportsColorAdjustment;
            },
            focussedAnnotation: function () {
                return this.annotations[this.focussedAnnotationIndex];
            },
            isDefaultCycleMode: function () {
                return this.cycleMode === 'default';
            },
            isVolareCycleMode: function () {
                return this.cycleMode === 'volare';
            },
            isLawnmowerCycleMode: function () {
                return this.cycleMode === 'lawnmower';
            },
        },
        methods: {
            getImageAndAnnotationsPromises: function () {
                return [
                    imagesStore.fetchAndDrawImage(this.imageId),
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
            handleNext: function () {
                if (this.loading) {
                    return;
                }

                if (this.isVolareCycleMode) {
                    if (this.focussedAnnotationIndex < (this.annotations.length - 1)) {
                        this.focussedAnnotationIndex++;
                        return;
                    } else {
                        // Show the next image in this case, so don't return.
                        this.focussedAnnotationIndex = -Infinity;
                    }
                } else if (this.isLawnmowerCycleMode) {
                    this.$refs.canvas.showNextImageSection();
                    return;
                }

                // Show next image.
                this.imageIndex = this.getNextIndex(this.imageIndex);
            },
            handlePrevious: function () {
                if (this.loading) {
                    return;
                }

                if (this.isVolareCycleMode) {
                    if (this.focussedAnnotationIndex > 0) {
                        this.focussedAnnotationIndex--;
                        return;
                    } else {
                        // Show the previous image in this case, so don't return.
                        this.focussedAnnotationIndex = Infinity;
                    }
                } else if (this.isLawnmowerCycleMode) {
                    this.$refs.canvas.showPreviousImageSection();
                    return;
                }

                // Show previous image.
                this.imageIndex = this.getPreviousIndex(this.imageIndex);
            },
            maybeUpdateFocussedAnnotation: function () {
                if (this.isVolareCycleMode) {
                    if (this.annotations.length > 0) {
                        if (this.focussedAnnotationIndex === Infinity) {
                            this.focussedAnnotationIndex = this.annotations.length - 1;
                        } else {
                            this.focussedAnnotationIndex = 0;
                        }
                    } else {
                        this.focussedAnnotationIndex = null;
                        // Show the whole image if there are no annotations.
                        this.$refs.canvas.fitImage();
                    }
                } else {
                    this.focussedAnnotationIndex = null;
                }
            },
            maybeUpdateShownImageSection: function () {
                if (this.isLawnmowerCycleMode) {
                    this.$refs.canvas.showFirstImageSection();
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
            focusAnnotation: function (annotation, fast) {
                this.$refs.canvas.focusAnnotation(annotation, fast);
            },
            handleDetachAnnotationLabel: function (annotation, label) {
                if (this.isEditor) {
                    annotationsStore.detachLabel(annotation, label)
                        .catch(messages.handleErrorResponse);
                }
            },
            handleDeleteAnnotation: function (annotation) {
                if (this.isEditor) {
                    if (this.lastCreatedAnnotation && this.lastCreatedAnnotation.id === annotation.id) {
                        this.lastCreatedAnnotation = null;
                    }
                    annotationsStore.delete(annotation)
                        .catch(messages.handleErrorResponse);
                }
            },
            handleDeleteAnnotations: function (annotations) {
                annotations.forEach(this.handleDeleteAnnotation);
            },
            handleUpdateAnnotations: function (annotations) {
                if (this.isEditor) {
                    Vue.Promise.all(annotations.map(annotationsStore.update))
                        .catch(messages.handleErrorResponse);
                }
            },
            maybeSelectAndFocusAnnotation: function () {
                var id = urlParams.get('annotation');
                if (id) {
                    id = parseInt(id);
                    var annotations = this.annotations;
                    for (var i = annotations.length - 1; i >= 0; i--) {
                        if (annotations[i].id === id) {
                            this.focusAnnotation(annotations[i]);
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
            handleNewAnnotation: function (annotation, removeCallback) {
                if (this.isEditor) {
                    annotation.label_id = this.selectedLabel.id;
                    // TODO: confidence control
                    annotation.confidence = 1;
                    annotationsStore.create(this.imageId, annotation)
                        .then(this.setLastCreatedAnnotation)
                        .catch(function (response) {
                            // Remove the temporary annotation if saving failed.
                            removeCallback();
                            messages.handleErrorResponse(response);
                        });
                }
            },
            handleAttachLabel: function (annotation, label) {
                label = label || this.selectedLabel;
                if (this.isEditor && label) {
                    var annotationLabel = {
                        label_id: label.id,
                        // TODO: confidence control
                        confidence: 1,
                    };
                    annotationsStore.attachLabel(annotation, annotationLabel)
                        .catch(messages.handleErrorResponse);
                }
            },
            handleAttachAllSelected: function () {
                this.selectedAnnotations.forEach(this.handleAttachLabel);
            },
            emitImageChanged: function () {
                events.$emit('images.change', this.imageId);
            },
            cachePreviousAndNext: function () {
                var previousId = imagesIds[this.getPreviousIndex(this.imageIndex)];
                var nextId = imagesIds[this.getNextIndex(this.imageIndex)];
                Vue.Promise.all([
                    annotationsStore.fetchAnnotations(nextId),
                    imagesStore.fetchImage(nextId),
                ]).then(function () {
                    annotationsStore.fetchAnnotations(previousId);
                    imagesStore.fetchImage(previousId);
                });
            },
            setLastCreatedAnnotation: function (annotation) {
                if (this.lastCreatedAnnotationTimeout) {
                    window.clearTimeout(this.lastCreatedAnnotationTimeout);
                }
                var self = this;
                this.lastCreatedAnnotation = annotation;
                this.lastCreatedAnnotationTimeout = window.setTimeout(function() {
                    self.lastCreatedAnnotation = null;
                }, 10000);
            },
            updateColorAdjustment: function (params) {
                var canvas = this.$refs.canvas;
                utils.debounce(function () {
                    imagesStore.updateColorAdjustment(params);
                    canvas.render();
                }, 100, 'annotations.color-adjustment.update');
            },
            handleSettingsChange: function (key, value) {
                switch (key) {
                    case 'annotationOpacity':
                        this.annotationOpacity = value;
                        break;
                    case 'cycleMode':
                        this.cycleMode = value;
                        this.maybeUpdateFocussedAnnotation();
                        this.maybeUpdateShownImageSection();
                        break;
                }
            },
        },
        watch: {
            imageIndex: function (index) {
                this.startLoading();
                Vue.Promise.all(this.getImageAndAnnotationsPromises())
                    .then(this.setCurrentImageAndAnnotations)
                    .then(this.updateUrlSlug)
                    .then(this.maybeSelectAndFocusAnnotation)
                    .then(this.maybeUpdateFocussedAnnotation)
                    .then(this.emitImageChanged)
                    .then(this.finishLoading)
                    // When everything is loaded, pre-fetch the data of the next and
                    // previous images so they can be switched fast.
                    .then(this.cachePreviousAndNext);
            },
            focussedAnnotation: function (annotation) {
                if (annotation) {
                    this.selectedAnnotations.forEach(function (a) {
                        a.selected = false;
                    });
                    annotation.selected = true;
                    this.focusAnnotation(annotation, true);
                }
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
            events.$on('annotations.focus', this.focusAnnotation);
            events.$on('annotations.detachLabel', this.handleDetachAnnotationLabel);
            events.$on('annotations.delete', this.handleDeleteAnnotation);
        },
    });
});
