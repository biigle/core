/**
 * View model for the annotator container
 */
biigle.$viewModel('annotator-container', function (element) {
    var events = biigle.$require('events');
    var volumeId = biigle.$require('annotations.volumeId');
    var imagesIds = biigle.$require('annotations.imagesIds');
    var imagesStore = biigle.$require('annotations.stores.images');
    var annotationsStore = biigle.$require('annotations.stores.annotations');
    var urlParams = biigle.$require('urlParams');
    var messages = biigle.$require('messages.store');
    var debounce = biigle.$require('utils.debounce');
    var settings = biigle.$require('annotations.stores.settings');

    var LabelFilter = biigle.$require('annotations.models.LabelAnnotationFilter');
    var UserFilter = biigle.$require('annotations.models.UserAnnotationFilter');
    var ShapeFilter = biigle.$require('annotations.models.ShapeAnnotationFilter');
    var SessionFilter = biigle.$require('annotations.models.SessionAnnotationFilter');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            annotationsTab: biigle.$require('annotations.components.siaAnnotationsTab'),
            labelsTab: biigle.$require('annotations.components.labelsTab'),
            annotationModesTab: biigle.$require('annotations.components.annotationModesTab'),
            colorAdjustmentTab: biigle.$require('annotations.components.colorAdjustmentTab'),
            imageLabelTab: biigle.$require('annotations.components.imageLabelTab'),
            settingsTab: biigle.$require('annotations.components.settingsTab'),
            annotationCanvas: biigle.$require('annotations.components.annotationCanvas'),
        },
        data: {
            isEditor: biigle.$require('annotations.isEditor'),
            imageIndex: null,
            image: null,
            annotations: [],
            annotationFilter: null,
            annotationFilters: [
                new LabelFilter(),
                new UserFilter(),
                new ShapeFilter({data: {shapes: biigle.$require('annotations.shapes')}}),
                new SessionFilter({data: {sessions: biigle.$require('annotations.sessions')}}),
            ],
            lastCreatedAnnotation: null,
            lastCreatedAnnotationTimeout: null,
            annotationOpacity: 1,
            // Initial map viewport.
            mapCenter: undefined,
            mapResolution: undefined,
            selectedLabel: null,
            annotationMode: 'default',
            focussedAnnotationIndex: null,
            // For lawnmower and sampling modes: When switching images, this determines
            // if the first (0) or the last (Infinity) image section/sampling location
            // should be shown.
            annotationModeCarry: null,
            showMousePosition: false,
            showZoomLevel: false,
            showLabelTooltip: false,
            showMeasureTooltip: false,
            showMinimap: true,
            showScaleLine: false,
            imagesArea: null,
            openTab: null,
            userUpdatedVolareResolution: false,
        },
        computed: {
            imageId: function () {
                return this.imagesIds[this.imageIndex];
            },
            hasAnnotationFilter: function () {
                return this.annotationFilter !== null;
            },
            filteredAnnotations: function () {
                var annotations = this.annotations.filter(function (a) {
                    return !a.markedForDeletion;
                });

                if (this.annotationFilter) {
                    return this.annotationFilter.filter(annotations);
                }

                return annotations;
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
            isDefaultAnnotationMode: function () {
                return this.annotationMode === 'default';
            },
            isVolareAnnotationMode: function () {
                return this.annotationMode === 'volare';
            },
            isLawnmowerAnnotationMode: function () {
                return this.annotationMode === 'lawnmower';
            },
            isSamplingAnnotationMode: function () {
                return this.annotationMode.endsWith('Sampling');
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

                if (this.isVolareAnnotationMode) {
                    if (this.focussedAnnotationIndex < (this.filteredAnnotations.length - 1)) {
                        this.focussedAnnotationIndex++;
                        return;
                    } else {
                        // Show the first annotation of the next image in this case, so
                        // don't return.
                        this.focussedAnnotationIndex = -Infinity;
                    }
                } else if (this.isLawnmowerAnnotationMode) {
                    // This returns false if the image section can't be advanced (i.e.
                    // the last section is shown).
                    if (this.$refs.canvas.showNextImageSection()) {
                        return;
                    } else {
                        // Show the first image section in the next image in this case,
                        // so don't return.
                        this.annotationModeCarry = 0;
                    }
                } else if (this.isSamplingAnnotationMode) {
                    // Similar mechanism than for Lanwmower Mode.
                    if (this.$refs.canvas.showNextSamplingLocation()) {
                        return;
                    } else {
                        this.annotationModeCarry = 0;
                    }
                }

                // Show next image.
                this.imageIndex = this.getNextIndex(this.imageIndex);
            },
            handlePrevious: function () {
                if (this.loading) {
                    return;
                }

                if (this.isVolareAnnotationMode) {
                    if (this.focussedAnnotationIndex > 0) {
                        this.focussedAnnotationIndex--;
                        return;
                    } else {
                        // Show the last annotation of the previous image in this case,
                        // so don't return.
                        this.focussedAnnotationIndex = Infinity;
                    }
                } else if (this.isLawnmowerAnnotationMode) {
                    // This returns false if the image section can't be reversed (i.e.
                    // the first section is shown).
                    if (this.$refs.canvas.showPreviousImageSection()) {
                        return;
                    } else {
                        // Show the last image section in the previous image in this
                        // case, so don't return.
                        this.annotationModeCarry = Infinity;
                    }
                } else if (this.isSamplingAnnotationMode) {
                    // Similar mechanism than for Lanwmower Mode.
                    if (this.$refs.canvas.showPreviousSamplingLocation()) {
                        return;
                    } else {
                        this.annotationModeCarry = Infinity;
                    }
                }

                // Show previous image.
                this.imageIndex = this.getPreviousIndex(this.imageIndex);
            },
            maybeUpdateFocussedAnnotation: function () {
                if (this.isVolareAnnotationMode) {
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
                if (this.isLawnmowerAnnotationMode) {
                    if (this.annotationModeCarry === Infinity) {
                        this.$refs.canvas.showLastImageSection();
                    } else {
                        this.$refs.canvas.showFirstImageSection();
                    }
                }
            },
            maybeUpdateShownSampling: function (data) {
                if (this.isSamplingAnnotationMode) {
                    this.$refs.canvas.setSamplingData(this.annotationMode, data);

                    if (this.annotationModeCarry === Infinity) {
                        // Use nextTick so the annotationMode can propagate down to the
                        // annotationCanvas before the sampling location is shown.
                        this.$nextTick(this.$refs.canvas.showLastSamplingLocation);
                    } else {
                        this.$nextTick(this.$refs.canvas.showFirstSamplingLocation);
                    }
                }
            },
            maybeUpdateAnnotationMode: function (data) {
                this.maybeUpdateFocussedAnnotation();
                this.maybeUpdateShownImageSection();
                this.maybeUpdateShownSampling(data);
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
            handleSelectAnnotation: function (annotation, shift) {
                // Handle the case where the second argument is an event object for
                // backwards compatibility.
                if (shift === true || (typeof shift === 'object' && shift.shiftKey)) {
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
            },
            handleDeselectAnnotation: function (annotation) {
                if (annotation) {
                    annotation.selected = false;
                } else {
                    this.annotations.forEach(function (a) {
                        a.selected = false;
                    });
                }
            },
            focusAnnotation: function (annotation, fast, keepResolution) {
                this.$refs.canvas.focusAnnotation(annotation, fast, keepResolution);
            },
            handleDetachAnnotationLabel: function (annotation, annotationLabel) {
                if (this.isEditor) {
                    if (annotation.labels.length > 1) {
                        annotationsStore.detachLabel(annotation, annotationLabel)
                            .catch(messages.handleErrorResponse);
                    } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                        this.handleDeleteAnnotation(annotation);
                    }
                }
            },
            handleDeleteAnnotation: function (annotation) {
                if (!this.isEditor) return;

                if (this.lastCreatedAnnotation && this.lastCreatedAnnotation.id === annotation.id) {
                    this.lastCreatedAnnotation = null;
                }

                // Mark for deletion so the annotation is immediately removed from
                // the canvas. See https://github.com/biigle/annotations/issues/70
                Vue.set(annotation, 'markedForDeletion', true);
                annotationsStore.delete(annotation)
                    .catch(function (response) {
                        annotation.markedForDeletion = false;
                        messages.handleErrorResponse(response);
                    });
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
            selectAndFocusAnnotation: function (annotation, keepResolution) {
                this.selectedAnnotations.forEach(function (a) {
                    a.selected = false;
                });
                annotation.selected = true;
                this.focusAnnotation(annotation, true, keepResolution);
            },
            handleFilter: function (filter) {
                this.annotationFilter = filter;
            },
            resetFilter: function () {
                if (this.annotationFilter) {
                    this.annotationFilter.reset();
                }
                this.annotationFilter = null;
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
                        .catch(messages.handleErrorResponse)
                        // Remove the temporary annotation if saving succeeded or failed.
                        .finally(removeCallback);
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
                // If there is only one image, previousId and nextId equal this.imageId.
                // No caching should be requested as this might deselect any selected
                // annotations on the current image.
                if (previousId !== this.imageId) {
                    Vue.Promise.all([
                            annotationsStore.fetchAnnotations(nextId),
                            imagesStore.fetchImage(nextId),
                            annotationsStore.fetchAnnotations(previousId),
                            imagesStore.fetchImage(previousId),
                        ])
                        // Ignore errors in this case. The application will try to reload
                        // the data again if the user switches to the respective image
                        // and display the error message then.
                        .catch(function () {});
                }
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
                debounce(function () {
                    imagesStore.updateColorAdjustment(params);
                    canvas.render();
                }, 100, 'annotations.color-adjustment.update');
            },
            handleSettingsChange: function (key, value) {
                switch (key) {
                    case 'annotationOpacity':
                        this.annotationOpacity = value;
                        break;
                    case 'mousePosition':
                        this.showMousePosition = value;
                        break;
                    case 'zoomLevel':
                        this.showZoomLevel = value;
                        break;
                    case 'scaleLine':
                        this.showScaleLine = value;
                        break;
                    case 'labelTooltip':
                        this.showLabelTooltip = value;
                        break;
                    case 'measureTooltip':
                        this.showMeasureTooltip = value;
                        break;
                    case 'minimap':
                        this.showMinimap = value;
                        break;
                }
            },
            handleAnnotationModeChange: function (mode, data) {
                this.annotationMode = mode;
                this.annotationModeCarry = null;
                this.maybeUpdateAnnotationMode(data);
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
            createSampledAnnotation: function () {
                this.$refs.canvas.createSampledAnnotation();
            },
            fetchImagesArea: function () {
                if (!this.imagesArea) {
                    this.imagesArea = {};
                    biigle.$require('annotations.api.volumeImageArea')
                        .get({id: volumeId})
                        .then(this.setImagesArea, messages.handleErrorResponse);
                }
            },
            setImagesArea: function (response) {
                this.imagesArea = response.body;
            },
            handleRequiresSelectedLabel: function () {
                messages.info('Please select a label first.');
                this.$refs.sidebar.$emit('open', 'labels');
            },
            maybeShowTilingInProgressMessage: function() {
                if (this.image.tilingInProgress) {
                    messages.warning('This image is currently being processed. Please retry later.');
                }
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
                        .then(this.maybeUpdateAnnotationMode)
                        .then(this.emitImageChanged)
                        .then(this.maybeShowTilingInProgressMessage)
                        // When everything is loaded, pre-fetch the data of the next and
                        // previous images so they can be switched fast.
                        .then(this.cachePreviousAndNext)
                        .finally(this.finishLoading);
                }
            },
            focussedAnnotation: function (annotation) {
                if (annotation) {
                    this.selectAndFocusAnnotation(annotation, this.userUpdatedVolareResolution);
                }
            },
            annotationFilter: function () {
                this.maybeUpdateFocussedAnnotation();
            },
            showScaleLine: function (show) {
                if (show) {
                    this.fetchImagesArea();
                }
            },
            showMeasureTooltip: function (show) {
                if (show) {
                    this.fetchImagesArea();
                }
            },
            isVolareAnnotationMode: function (enabled) {
                if (!enabled) {
                    this.userUpdatedVolareResolution = false;
                }
            },
            mapResolution: function (resolution) {
                if (this.isVolareAnnotationMode) {
                    this.userUpdatedVolareResolution = true;
                }
            },
            annotations: function (annotations) {
                this.annotationFilters[0].annotations = annotations;
                this.annotationFilters[1].annotations = annotations;
            },
        },
        created: function () {
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

            // These events are used by the SHERPA client of Michael Kloster and
            // retained for backwards compatibility.
            events.$on('annotations.select', this.handleSelectAnnotation);
            events.$on('annotations.deselect', this.handleDeselectAnnotation);
            events.$on('annotations.detachLabel', this.handleDetachAnnotationLabel);
            events.$on('annotations.delete', this.handleDeleteAnnotation);
            events.$on('annotations.focus', this.focusAnnotation);

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
        mounted: function () {
            events.$emit('annotations.map.init', this.$refs.canvas.map);
        },
    });
});
