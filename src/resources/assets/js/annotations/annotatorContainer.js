/**
 * View model for the annotator container
 */
biigle.$viewModel('annotator-container', function (element) {
    var events = biigle.$require('events');
    var volumeId = biigle.$require('annotations.volumeId');
    var imagesIds = biigle.$require('annotations.imagesIds');
    var imagesStore = biigle.$require('annotations.stores.images');
    var annotationsStore = biigle.$require('annotations.stores.annotations');
    var urlParams = biigle.$require('volumes.urlParams');
    var messages = biigle.$require('messages.store');
    var utils = biigle.$require('annotations.stores.utils');
    var settings = biigle.$require('annotations.stores.settings');

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
            // Determines if the current image section is the last (Infinity) or the
            // first (0) one.
            focussedImageSectionIndex: null,
            showMousePosition: false,
            showAnnotationTooltip: false,
            openTab: null,
        },
        computed: {
            imageId: function () {
                return this.imagesIds[this.imageIndex];
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
            selectedAnnotations: function () {
                return this.filteredAnnotations.filter(function (annotation) {
                    return annotation.selected;
                });
            },
            supportsColorAdjustment: function () {
                return imagesStore.supportsColorAdjustment;
            },
            focussedAnnotation: function () {
                return this.filteredAnnotations[this.focussedAnnotationIndex];
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
            imagesIds: function () {
                // Look for a sequence of image IDs in local storage. This sequence is
                // produced by the volume overview page when the images are sorted or
                // filtered. We want to reflect the same ordering or filtering here
                // in the annotator.
                var storedSequence = window.localStorage.getItem('biigle.volumes.' + volumeId + '.images');
                if (storedSequence) {
                    // If there is such a stored sequence, filter out any image IDs that
                    // do not belong to the volume (any more), since some of them may
                    // have been deleted in the meantime.
                    var map = {};
                    imagesIds.forEach(function (id) {
                        map[id] = null;
                    });
                    return JSON.parse(storedSequence).filter(function (id) {
                        return map.hasOwnProperty(id);
                    });
                }

                return imagesIds;
            },
        },
        methods: {
            getImageAndAnnotationsPromises: function (id) {
                return [
                    imagesStore.fetchAndDrawImage(id),
                    annotationsStore.fetchAnnotations(id),
                ];
            },
            setCurrentImageAndAnnotations: function (args) {
                if (args) {
                    this.image = args[0];
                    this.annotations = args[1];
                } else {
                    // This might happen if there was an error loading the image or the
                    // annotations.
                    this.image = null;
                    this.annotations = [];
                }
            },
            updateUrlSlug: function () {
                urlParams.setSlug(this.imageId);
            },
            getNextIndex: function (index) {
                return (index + 1) % this.imagesIds.length;
            },
            getPreviousIndex: function (index) {
                return (index + this.imagesIds.length - 1) % this.imagesIds.length;
            },
            handleNext: function () {
                if (this.loading) {
                    return;
                }

                if (this.isVolareCycleMode) {
                    if (this.focussedAnnotationIndex < (this.filteredAnnotations.length - 1)) {
                        this.focussedAnnotationIndex++;
                        return;
                    } else {
                        // Show the first annotation of the next image in this case, so
                        // don't return.
                        this.focussedAnnotationIndex = -Infinity;
                    }
                } else if (this.isLawnmowerCycleMode) {
                    // This returns false if the image section can't be advanced (i.e.
                    // the last section is shown).
                    if (this.$refs.canvas.showNextImageSection()) {
                        return;
                    } else {
                        // Show the first image section in the next image in this case,
                        // so don't return.
                        this.focussedImageSectionIndex = 0;
                    }
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
                        // Show the last annotation of the previous image in this case,
                        // so don't return.
                        this.focussedAnnotationIndex = Infinity;
                    }
                } else if (this.isLawnmowerCycleMode) {
                    // This returns false if the image section can't be reversed (i.e.
                    // the first section is shown).
                    if (this.$refs.canvas.showPreviousImageSection()) {
                        return;
                    } else {
                        // Show the last image section in the previous image in this
                        // case, so don't return.
                        this.focussedImageSectionIndex = Infinity;
                    }
                }

                // Show previous image.
                this.imageIndex = this.getPreviousIndex(this.imageIndex);
            },
            maybeUpdateFocussedAnnotation: function () {
                if (this.isVolareCycleMode) {
                    if (this.filteredAnnotations.length > 0) {
                        if (this.focussedAnnotationIndex === Infinity) {
                            // Show the last annotation if the previous image is shown.
                            this.focussedAnnotationIndex = this.filteredAnnotations.length - 1;
                        } else {
                            // Show the first annotation if the next image is shown or
                            // the annotation filter changed.
                            this.focussedAnnotationIndex = 0;
                        }
                    } else {
                        // Show the whole image if there are no annotations.
                        this.focussedAnnotationIndex = null;
                        this.$refs.canvas.fitImage();
                    }
                } else {
                    this.focussedAnnotationIndex = null;
                }
            },
            maybeUpdateShownImageSection: function () {
                if (this.isLawnmowerCycleMode) {
                    if (this.focussedImageSectionIndex === Infinity) {
                        this.$refs.canvas.showLastImageSection();
                    } else {
                        this.$refs.canvas.showFirstImageSection();
                    }
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
            selectAndFocusAnnotation: function (annotation) {
                this.selectedAnnotations.forEach(function (a) {
                    a.selected = false;
                });
                annotation.selected = true;
                this.focusAnnotation(annotation, true);
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
                events.$emit('images.change', this.imageId, this.image);
            },
            cachePreviousAndNext: function () {
                var previousId = this.imagesIds[this.getPreviousIndex(this.imageIndex)];
                var nextId = this.imagesIds[this.getNextIndex(this.imageIndex)];
                Vue.Promise.all([
                        annotationsStore.fetchAnnotations(nextId),
                        imagesStore.fetchImage(nextId),
                        annotationsStore.fetchAnnotations(previousId),
                        imagesStore.fetchImage(previousId),
                    ])
                    // Ignore errors in this case. The application will try to reload
                    // the data again if the user switches to the respective image and
                    // display the error message then.
                    .catch(function () {});
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
                    case 'mousePosition':
                        this.showMousePosition = value;
                        break;
                    case 'annotationTooltip':
                        this.showAnnotationTooltip = value;
                }
            },
            handleOpenedTab: function (name) {
                settings.set('openTab', name);
            },
            handleClosedTab: function (name) {
                settings.delete('openTab');
            },
            handleLoadingError: function (message) {
                messages.danger(message);
            },
        },
        watch: {
            imageId: function (id) {
                if (id) {
                    this.startLoading();
                    Vue.Promise.all(this.getImageAndAnnotationsPromises(id))
                        .catch(this.handleLoadingError)
                        .then(this.setCurrentImageAndAnnotations)
                        .then(this.updateUrlSlug)
                        .then(this.maybeUpdateFocussedAnnotation)
                        .then(this.maybeUpdateShownImageSection)
                        .then(this.emitImageChanged)
                        // When everything is loaded, pre-fetch the data of the next and
                        // previous images so they can be switched fast.
                        .then(this.cachePreviousAndNext)
                        .finally(this.finishLoading);
                }
            },
            focussedAnnotation: function (annotation) {
                if (annotation) {
                    this.selectAndFocusAnnotation(annotation);
                }
            },
            annotationFilter: function () {
                this.maybeUpdateFocussedAnnotation();
            },
        },
        created: function () {
            this.startLoading();
            if (this.imagesIds.length === 0) {
                messages.info('Your current volume filtering contains no images.');
                return;
            }

            var index = this.imagesIds.indexOf(biigle.$require('annotations.imageId'));
            if (index === -1) {
                index = 0;
                messages.info('The requested image does not exist in your current volume filtering. Switching to the first image.');
            }
            this.imageIndex = index;

            events.$emit('images.sequence', this.imagesIds);

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

            if (urlParams.get('annotation')) {
                var id = parseInt(urlParams.get('annotation'));
                var self = this;
                events.$once('images.change', function () {
                    var annotations = self.annotations;
                    for (var i = annotations.length - 1; i >= 0; i--) {
                        if (annotations[i].id === id) {
                            self.selectAndFocusAnnotation(annotations[i]);
                            return;
                        }
                    }
                });
            }

            if (settings.has('openTab')) {
                this.openTab = settings.get('openTab');
            }
        },
    });
});
