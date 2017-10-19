/**
 * View model for the annotator navbar
 */
biigle.$viewModel('annotations-navbar', function (element) {

    new Vue({
        el: element,
        mixins: [biigle.$require('annotations.mixins.imageFilenameTracker')],
        data: {
            // Take the pre-filled content of the element when the page is initially
            // loaded until the image id has been set. Otherwise the filename would
            // vanish and appear again what we don't want.
            defaultFilename: element.innerHTML,
            imageIdsToSee: biigle.$require('annotations.imagesIds').slice(),
        },
        watch: {
            currentImageId: function (id) {
                var ids = this.imageIdsToSee;
                for (var i = ids.length - 1; i >= 0; i--) {
                    if (ids[i] === id) {
                        ids.splice(i, 1);
                        break;
                    }
                }
            },
            imageIdsToSee: function (ids) {
                if (ids.length === 0) {
                    biigle.$require('messages.store').info('You have now seen all images of this batch.');
                }
            },
            currentImageFilename: function (filename) {
                document.title = 'Annotate ' + filename;
            },
        },
        created: function () {
            var self = this;
            biigle.$require('events').$on('images.sequence', function (ids) {
                self.imageIdsToSee = ids.slice();
            });
        },
    });
});

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
            showMinimap: true,
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
                var annotations = this.annotations.filter(function (a) {
                    return !a.markedForDeletion;
                });

                if (this.hasAnnotationFilter) {
                    return annotations.filter(this.annotationFilter);
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
                if (!this.isEditor) return;

                if (this.lastCreatedAnnotation && this.lastCreatedAnnotation.id === annotation.id) {
                    this.lastCreatedAnnotation = null;
                }

                // Mark for deletion so the annotation is immediately removed from
                // the canvas. See https://github.com/BiodataMiningGroup/biigle-annotations/issues/70
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
                        break;
                    case 'minimap':
                        this.showMinimap = value;
                        break;
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

/**
 * A mixin that keeps track of the current image filename
 *
 * @type {Object}
 */
biigle.$component('annotations.mixins.imageFilenameTracker', {
    data: function () {
        return {
            filenameMap: {},
            currentImageId: null,
            defaultFilename: '',
        };
    },
    computed: {
        currentImageFilename: function () {
            return this.filenameMap[this.currentImageId] || this.defaultFilename;
        },
    },
    methods: {
        updateImageId: function (id) {
            this.currentImageId = id;
        },
    },
    created: function () {
        var events = biigle.$require('events');
        var imagesIds = biigle.$require('annotations.imagesIds');
        var imagesFilenames = biigle.$require('annotations.imagesFilenames');
        var map = this.filenameMap;

        imagesIds.forEach(function (id, index) {
            map[id] = imagesFilenames[index];
        });
        events.$on('images.change', this.updateImageId);
    },
});

/**
 * Control for attaching labels to existing annotations
 */
biigle.$declare('annotations.ol.AttachLabelInteraction', function () {
    function AttachLabelInteraction(options) {
        ol.interaction.Pointer.call(this, {
            handleUpEvent: this.handleUpEvent,
            handleDownEvent: this.handleDownEvent,
            handleMoveEvent: this.handleMoveEvent
        });

        this.on('change:active', this.toggleActive);

        this.features = options.features !== undefined ? options.features : null;

        this.currentFeature = undefined;
        this.map = options.map;
    }

    ol.inherits(AttachLabelInteraction, ol.interaction.Pointer);

    AttachLabelInteraction.prototype.toggleActive = function (e) {
        if (e.oldValue) {
            var element = this.map.getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        }
    };

    // the label should be attached on mouseup but the event works only with the
    // pointer interaction if mousedown returned true before
    AttachLabelInteraction.prototype.handleDownEvent = function (event) {
        this.currentFeature = this.featuresAtPixel(event.pixel, event.map);
        return !!this.currentFeature;
    };

    AttachLabelInteraction.prototype.handleUpEvent = function (event) {
        if (this.currentFeature && this.currentFeature.get('annotation')) {
            this.dispatchEvent({type: 'attach', feature: this.currentFeature});
        }

        this.currentFeature = undefined;
    };

    AttachLabelInteraction.prototype.handleMoveEvent = function (event) {
        var elem = event.map.getTargetElement();
        var feature = this.featuresAtPixel(event.pixel, event.map);

        if (feature) {
            elem.style.cursor = 'pointer';
        } else {
            elem.style.cursor = '';
        }
    };

    AttachLabelInteraction.prototype.featuresAtPixel = function (pixel, map) {
        var found = null;

        var intersectingFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
            return feature;
        }, this);

        if (this.handlesFeature(intersectingFeature)) {
            found = intersectingFeature;
        }

        return found;
    };

    AttachLabelInteraction.prototype.handlesFeature = function (feature) {
        if (this.features) {
            return this.features.getArray().indexOf(feature) !== -1;
        }

        return false;
    };

    return AttachLabelInteraction;
});

/**
 * Control for translating OpenLayers features with extra functions
 */
biigle.$declare('annotations.ol.ExtendedTranslateInteraction', function () {
    function ExtendedTranslateInteraction(options) {
        ol.interaction.Translate.call(this, options);

        this.features = options.features !== undefined ? options.features : null;
        this.on('change:active', this.toggleListeners);

        var self = this;

        this.translateUp = function () {
            return self.translate(0, 1);
        };

        this.translateDown = function () {
            return self.translate(0, -1);
        };

        this.translateLeft = function () {
            return self.translate(-1, 0);
        };

        this.translateRight = function () {
            return self.translate(1, 0);
        };

        this.keyboard = biigle.$require('keyboard');
        this.utils = biigle.$require('annotations.stores.utils');
        this.setMap(options.map);
        this.translating = false;
    }
    ol.inherits(ExtendedTranslateInteraction, ol.interaction.Translate);

    ExtendedTranslateInteraction.prototype.toggleListeners = function (e) {
        if (e.oldValue) {
            this.keyboard.off(37, this.translateLeft);
            this.keyboard.off(38, this.translateUp);
            this.keyboard.off(39, this.translateRight);
            this.keyboard.off(40, this.translateDown);
            // The default translate interaction does not reset the cursor when
            // deactivated.
            var element = this.getMap().getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        } else {
            this.keyboard.on(37, this.translateLeft, 10);
            this.keyboard.on(38, this.translateUp, 10);
            this.keyboard.on(39, this.translateRight, 10);
            this.keyboard.on(40, this.translateDown, 10);
        }
    };

    ExtendedTranslateInteraction.prototype.translate = function (deltaX, deltaY) {
        if (this.features && this.features.getLength() > 0) {
            if (!this.translating) {
                this.dispatchEvent({type: 'translatestart', features: this.features});
                this.translating = true;
            }
            this.features.forEach(function(feature) {
                var geom = feature.getGeometry();
                geom.translate(deltaX, deltaY);
                feature.setGeometry(geom);
            });
            var self = this;
            var emit = function () {
                self.translating = false;
                self.dispatchEvent({type: 'translateend', features: self.features});
            };
            this.utils.debounce(emit, 500, 'ol.interactions.Translate.translateend');
            // Cancel keyboard event handlers with lower priority if features were
            // moved.
            return false;
        }
        // if there are no features, pass on the event
        return true;
    };

    return ExtendedTranslateInteraction;
});

/**
 * Control for drawing polygons using fuzzy matching of colors.
 */
biigle.$declare('annotations.ol.MagicWandInteraction', function () {
    function MagicWandInteraction(options) {
        ol.interaction.Pointer.call(this, {
            handleUpEvent: this.handleUpEvent,
            handleDownEvent: this.handleDownEvent,
            handleMoveEvent: this.handleMoveEvent,
            handleDragEvent: this.handleDragEvent,
        });

        this.on('change:active', this.toggleActive);

        // The image layer to use as source for the magic wand tool.
        this.layer = options.layer;

        // Initial color threshold for all sketches.
        this.colorThreshold = options.colorThreshold === undefined ? 15 :
            options.colorThreshold;
        // Current color threshold that is continuously updated while a sketch is drawn.
        this.currentThreshold = this.colorThreshold;

        // Blur radius to use for simplifying the computed area of the sketch.
        this.blurRadius = options.blurRadius === undefined ? 5 :
            options.blurRadius;

        // Value to adjust simplification of the sketch polygon. Higher values result in
        // less vertices of the polygon. Set to 0 to disable simplification.
        this.simplifyTolerant = options.simplifyTolerant === undefined ? 0 :
            options.simplifyTolerant;
        // Minimum number of required vertices for the simplified polygon.
        this.simplifyCount = options.simplifyCount === undefined ? 3 :
            options.simplifyCount;

        // Coordinates of the initial mousedown event.
        this.downPoint = [0, 0];
        this.map = options.map;

        // Canvas element to draw the snapshot of the current view of the image layer to.
        this.snapshotCanvas = document.createElement('canvas');
        this.snapshotContext = this.snapshotCanvas.getContext('2d');
        // MagicWand image object of the snapshot.
        this.snapshot = null;
        // Specifies whether the snapshot is currently updated. This is required to avoid
        // infinite recursion because the moveend event triggers the update but the
        // update in turn triggers a moveend event.
        this.updatingSnapshot = false;

        // If the mouse is inside of this radius (in px) around the downPoint while
        // drawing a sketch and the mouse button is released, the sketch is discarded.
        // If the button is released outside the radius, the sketch will be emitted as
        // new feature.
        this.discardRadius = options.discardRadius === undefined ? 20 :
            options.discardRadius;

        this.sketchFeature = null;
        this.sketchSource = options.source;

        if (this.sketchSource === undefined) {
            this.sketchSource = new ol.source.Vector();
            this.map.addLayer(new ol.layer.Vector({
                source: this.sketchSource,
                zIndex: 200,
            }));
        }

        this.sketchStyle = options.style === undefined ? null : options.style;

        // The point that indicates the downPoint where drawing of the sketch started.
        this.isShowingPoint = false;
        this.indicatorPoint = new ol.Feature(new ol.geom.Point([20, 20]));
        if (options.indicatorPointStyle !== undefined) {
            this.indicatorPoint.setStyle(options.indicatorPointStyle);
        }
        // The "x" that indicates that the current sketch will be discarded because the
        // mouse is near the downPoint.
        this.isShowingCross = false;
        this.indicatorCross = new ol.Feature(new ol.geom.Point([100, 100]));
        if (options.indicatorCrossStyle !== undefined) {
            this.indicatorCross.setStyle(options.indicatorCrossStyle);
        } else {
            this.indicatorCross.setStyle([
                new ol.style.Style({
                    image: new ol.style.RegularShape({
                        stroke: new ol.style.Stroke({
                            color: [0, 153, 255, 1],
                            width: 3,
                        }),
                        points: 4,
                        radius1: 6,
                        radius2: 0,
                        angle: Math.PI / 4
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.RegularShape({
                        stroke: new ol.style.Stroke({
                            color: [255, 255, 255, 0.75],
                            width: 1.5,
                        }),
                        points: 4,
                        radius1: 6,
                        radius2: 0,
                        angle: Math.PI / 4
                    })
                }),
            ]);
        }
        this.indicatorSource = new ol.source.Vector();
        this.map.addLayer(new ol.layer.Vector({
            source: this.indicatorSource,
            zIndex: 200,
        }));

        // Update the snapshot and set event listeners if the interaction is active.
        this.toggleActive();
    }

    ol.inherits(MagicWandInteraction, ol.interaction.Pointer);

    /**
     * Scaling factor of high DPI displays. The snapshot will be by a factor of
     * 'scaling' larger than the map so we have to include this factor in the
     * transformation of the mouse position.
     *
     * @return {Float}
     */
    MagicWandInteraction.prototype.getHighDpiScaling = function () {
        return this.snapshot.height / this.map.getSize()[1];
    };

    /**
     * Convert OpenLayers coordinates on the image layer to coordinates on the snapshot.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    MagicWandInteraction.prototype.toSnapshotCoordinates = function (points) {
        var extent = this.map.getView().calculateExtent(this.map.getSize());
        var height = this.snapshot.height;
        var factor = this.getHighDpiScaling() / this.map.getView().getResolution();

        return points.map(function (point) {
            return [
                Math.round((point[0] - extent[0]) * factor),
                height - Math.round((point[1] - extent[1]) * factor),
            ];
        });
    };

    /**
     * Convert coordinates on the snapshot to OpenLayers coordinates on the image layer.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    MagicWandInteraction.prototype.fromSnapshotCoordinates = function (points) {
        var extent = this.map.getView().calculateExtent(this.map.getSize());
        var height = this.snapshot.height;
        var factor = this.map.getView().getResolution() / this.getHighDpiScaling();

        return points.map(function (point) {
            return [
                Math.round((point[0] * factor) + extent[0]),
                Math.round(((height - point[1]) * factor) + extent[1]),
            ];
        });
    };

    /**
     * Convert MagicWand point objects to OpenLayers point arrays.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    MagicWandInteraction.prototype.fromMagicWandCoordinates = function (points) {
        return points.map(function (point) {
            return [point.x, point.y];
        });
    };

    /**
     * Finish drawing of a sketch.
     */
    MagicWandInteraction.prototype.handleUpEvent = function (e) {
        this.currentThreshold = this.colorThreshold;

        if (this.isShowingCross) {
            this.sketchSource.removeFeature(this.sketchFeature);
        } else {
            this.dispatchEvent({type: 'drawend', feature: this.sketchFeature});
        }

        this.sketchFeature = null;

        this.indicatorSource.clear();
        this.isShowingPoint = false;
        this.isShowingCross = false;

        return false;
    };

    /**
     * Start drawing of a sketch.
     */
    MagicWandInteraction.prototype.handleDownEvent = function (e) {
        this.downPoint[0] = Math.round(e.coordinate[0]);
        this.downPoint[1] = Math.round(e.coordinate[1]);
        this.drawSketch();
        this.indicatorPoint.getGeometry().setCoordinates(this.downPoint);
        this.indicatorCross.getGeometry().setCoordinates(this.downPoint);
        this.indicatorSource.clear();
        this.indicatorSource.addFeature(this.indicatorCross);
        this.isShowingCross = true;
        this.isShowingPoint = false;

        return true;
    };

    /**
     * Update the currently drawn sketch.
     */
    MagicWandInteraction.prototype.handleDragEvent = function (e) {
        var coordinate = this.toSnapshotCoordinates([e.coordinate]).shift();
        var x = Math.round(coordinate[0]);
        var y = Math.round(coordinate[1]);
        var point = this.toSnapshotCoordinates([this.downPoint]).shift();
        var px = point[0];
        var py = point[1];

        // Color threshold calculation. Inspired by the MagicWand example:
        // http://jsfiddle.net/Tamersoul/dr7Dw/
        if (x !== px || y !== py) {
            var dx = x - px;
            var dy = y - py;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len <= this.discardRadius) {
                if (!this.isShowingCross) {
                    this.indicatorSource.clear();
                    this.indicatorSource.addFeature(this.indicatorCross);
                    this.isShowingCross = true;
                    this.isShowingPoint = false;
                }
            } else if (!this.isShowingPoint) {
                this.indicatorSource.clear();
                this.indicatorSource.addFeature(this.indicatorPoint);
                this.isShowingCross = false;
                this.isShowingPoint = true;
            }

            var thres = Math.min(Math.max(this.colorThreshold + Math.round(len / 2 - this.colorThreshold), 1), 255);
            if (thres != this.currentThreshold) {
                this.currentThreshold = thres;
                this.drawSketch();
            }
        }
    };

    /**
     * Update the target point.
     */
    MagicWandInteraction.prototype.handleMoveEvent = function (e) {
        if (!this.isShowingPoint) {
            this.indicatorSource.clear();
            this.indicatorSource.addFeature(this.indicatorPoint);
            this.isShowingPoint = true;
            this.isShowingCross = false;
        }
        this.indicatorPoint.getGeometry().setCoordinates(e.coordinate);
    };

    /**
     * Update event listeners depending on the active state of the interaction.
     */
    MagicWandInteraction.prototype.toggleActive = function () {
        if (this.getActive()) {
            this.map.on(['moveend', 'change:size'], this.updateSnapshot, this);
            this.updateSnapshot();
        } else {
            this.map.un(['moveend', 'change:size'], this.updateSnapshot, this);
            this.indicatorSource.clear();
            this.isShowingPoint = false;
            this.isShowingCross = false;
            if (this.sketchFeature) {
                this.sketchSource.removeFeature(this.sketchFeature);
                this.sketchFeature = null;
            }
        }
    };

    /**
     * Update the snapshot of the image layer.
     */
    MagicWandInteraction.prototype.updateSnapshot = function () {
        if (!this.updatingSnapshot && this.layer) {
            this.layer.once('postcompose', function (e) {
                this.snapshotCanvas.width = e.context.canvas.width;
                this.snapshotCanvas.height = e.context.canvas.height;
                this.snapshotContext.drawImage(e.context.canvas, 0, 0);
                this.snapshot = this.snapshotContext.getImageData(0, 0, this.snapshotCanvas.width, this.snapshotCanvas.height);
                this.snapshot.bytes = 4;
            }, this);

            // Set flag to avoid infinite recursion since renderSync will trigger the
            // moveend event again!
            this.updatingSnapshot = true;
            this.map.renderSync();
            this.updatingSnapshot = false;
        }
    };

    /**
     * Update the layer to get the image information from.
     */
    MagicWandInteraction.prototype.setLayer = function (layer) {
        this.layer = layer;
    };

    /**
     * Recompute the currently drawn sketch.
     */
    MagicWandInteraction.prototype.drawSketch = function () {
        var point = this.toSnapshotCoordinates([this.downPoint]).shift();
        var sketch = MagicWand.floodFill(this.snapshot, point[0], point[1], this.currentThreshold);

        if (this.blurRadius > 0) {
            sketch = MagicWand.gaussBlurOnlyBorder(sketch, this.blurRadius);
        }

        // Crop the detected region of the sketch to the actual image extent. Wherever
        // the snapshot is transparent, there should not be a detected region.
        var sketchData = sketch.data;
        var snapshotData = this.snapshot.data;
        for (var i = sketchData.length - 1; i >= 0; i--) {
            if (snapshotData[i * 4] === 0) {
                sketchData[i] = 0;
            }
        }

        // Take only the outer contour.
        var contour = MagicWand.traceContours(sketch)
            .filter(function (c) {
                return !c.innner;
            })
            .shift();

        if (contour) {
            if (this.simplifyTolerant > 0) {
                contour = MagicWand.simplifyContours([contour], this.simplifyTolerant, this.simplifyCount).shift();
            }

            var points = this.fromSnapshotCoordinates(this.fromMagicWandCoordinates(contour.points));

            if (this.sketchFeature) {
                this.sketchFeature.getGeometry().setCoordinates([points]);
            } else {
                this.sketchFeature = new ol.Feature(new ol.geom.Polygon([points]));
                if (this.sketchStyle) {
                    this.sketchFeature.setStyle(this.sketchStyle);
                }
                this.sketchSource.addFeature(this.sketchFeature);
            }
        }
    };

    return MagicWandInteraction;
});

/**
 * Control for zooming the map image to the original resolution
 */
biigle.$declare('annotations.ol.ZoomToNativeControl', function () {
    function ZoomToNativeControl (opt_options) {
        var options = opt_options || {};
        var label = options.label ? options.label : '1';
        var button = document.createElement('button');
        var self = this;
        button.innerHTML = label;
        button.title = 'Zoom to original resolution';

        button.addEventListener('click', function () {
            self.zoomToNative.call(self);
        });

        var element = document.createElement('div');
        element.className = 'zoom-to-native ol-unselectable ol-control';
        element.appendChild(button);

        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });

        this.duration_ = options.duration !== undefined ? options.duration : 250;
    }

    ol.inherits(ZoomToNativeControl, ol.control.Control);

    ZoomToNativeControl.prototype.zoomToNative = function () {
        var map = this.getMap();
        var view = map.getView();
        if (!view) {
            // the map does not have a view, so we can't act
            // upon it
            return;
        }

        var currentResolution = view.getResolution();
        if (currentResolution) {
            if (this.duration_ > 0) {
                view.animate({
                    resolution: view.constrainResolution(1),
                    duration: this.duration_,
                });
            } else {
                view.setResolution(view.constrainResolution(1));
            }

        }
    };

    return ZoomToNativeControl;
});

/**
 * The annotator canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas', function () {
    // Don't create these as reactive Vue properties because they should work as fast as
    // possible.
    var map,
        styles,
        selectInteraction,
        drawInteraction,
        modifyInteraction,
        translateInteraction,
        attachLabelInteraction,
        magicWandInteraction;

    // Map to detect which features were changed between modifystart and modifyend
    // events of the modify interaction.
    var featureRevisionMap = {};

    var imageLayer = new ol.layer.Image();
    var tiledImageLayer = new ol.layer.Tile();

    var annotationFeatures = new ol.Collection();
    var annotationSource = new ol.source.Vector({
        features: annotationFeatures
    });
    var annotationLayer = new ol.layer.Vector({
        source: annotationSource,
        zIndex: 100,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
    });

    return {
        components: {
            minimap: biigle.$require('annotations.components.minimap'),
            labelIndicator: biigle.$require('annotations.components.labelIndicator'),
            mousePositionIndicator: biigle.$require('annotations.components.mousePositionIndicator'),
            controlButton: biigle.$require('annotations.components.controlButton'),
            annotationTooltip: biigle.$require('annotations.components.annotationTooltip'),
        },
        props: {
            editable: {
                type: Boolean,
                default: false,
            },
            image: {
                type: Object,
                default: null,
            },
            annotations: {
                type: Array,
                default: function () {
                    return [];
                },
            },
            selectedAnnotations: {
                type: Array,
                default: function () {
                    return [];
                },
            },
            center: {
                type: Array,
                default: undefined,
            },
            resolution: {
                type: Number,
                default: undefined,
            },
            selectedLabel: {
                default: null,
            },
            lastCreatedAnnotation: {
                default: null,
            },
            annotationOpacity: {
                type: Number,
                default: 1,
            },
            cycleMode: {
                type: String,
                default: 'default',
            },
            showMousePosition: {
                type: Boolean,
                default: false,
            },
            showAnnotationTooltip: {
                type: Boolean,
                default: false,
            },
            showMinimap: {
                type: Boolean,
                default: true,
            },
            // Specifies whether the displayed image is cross origin.
            crossOrigin: {
                type: Boolean,
                default: false,
            },
        },
        data: function () {
            var styles = biigle.$require('annotations.stores.styles');

            return {
                initialized: false,
                // Options to use for the view.fit function.
                viewFitOptions: {
                    padding: [50, 50, 50, 50],
                    minResolution: 1,
                },
                // There are several interaction modes like 'drawPoint', 'attach' or
                // 'translate' etc. For each mode the allowed/active OpenLayers map
                // interactions are different.
                interactionMode: 'default',
                // Size of the OpenLayers map in px.
                mapSize: [0, 0],
                // The image section information is needed for the lawnmower cycling mode
                // Index of the current image section in x and y direction.
                imageSection: [0, 0],
                // Actual center point of the current image section.
                imageSectionCenter: [0, 0],
                // Mouse position in image coordinates.
                mousePosition: [0, 0],
                // Mouse position in DOM element coordinates.
                mouseDomPosition: [0, 0],
                // Used to efficiently determine when to update hoveredAnnotations.
                hoveredAnnotationHash: '',
                hoveredAnnotations: [],
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    if (this.image.tiled === true) {
                        return [0, -this.image.height, this.image.width, 0];
                    }

                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 0, 0];
            },
            viewExtent: function () {
                // The view can't calculate the extent if the resolution is not set.
                // Also use this.initialized so this property is recomputed when the
                // map is set (because the map is no reactive object). See:
                // https://github.com/BiodataMiningGroup/biigle-annotations/issues/69
                if (this.initialized && this.resolution && map) {
                    return map.getView().calculateExtent(this.mapSize);
                }

                return [0, 0, 0, 0];
            },
            // Number of available image sections in x and y direction.
            imageSectionSteps: function () {
                return [
                    Math.ceil(this.image.width / (this.viewExtent[2] - this.viewExtent[0])),
                    Math.ceil(this.image.height / (this.viewExtent[3] - this.viewExtent[1])),
                ];
            },
            // Distance to travel between image sections in x and y direction.
            imageSectionStepSize: function () {
                var stepSize = [
                    this.viewExtent[2] - this.viewExtent[0],
                    this.viewExtent[3] - this.viewExtent[1],
                ];
                var overlap;
                if (this.imageSectionSteps[0] > 1) {
                    overlap = (stepSize[0] * this.imageSectionSteps[0]) - this.image.width;
                    stepSize[0] -= overlap / (this.imageSectionSteps[0] - 1);
                } else {
                    stepSize[0] = this.viewExtent[2];
                }

                if (this.imageSectionSteps[1] > 1) {
                    overlap = (stepSize[1] * this.imageSectionSteps[1]) - this.image.height;
                    stepSize[1] -= overlap / (this.imageSectionSteps[1] - 1);
                } else {
                    stepSize[1] = this.viewExtent[3];
                }


                return stepSize;
            },
            // Center position of the first image section [0, 0].
            imageSectionStartCenter: function () {
                var startCenter = [
                    (this.viewExtent[2] - this.viewExtent[0]) / 2,
                    (this.viewExtent[3] - this.viewExtent[1]) / 2,
                ];

                if (this.imageSectionSteps[0] <= 1) {
                    startCenter[0] = this.extent[2] / 2;
                }

                if (this.imageSectionSteps[1] <= 1) {
                    // If extent[3] is 0 we have a tiled image and the (negative) height
                    // is stored in extent[2]
                    startCenter[1] = (this.extent[3] || this.extent[1]) / 2;
                } else {
                    // This is the same as:
                    // if (image.tiled === true) {
                    //    startCenter[1] -= this.image.height;
                    // }
                    // because this.extent[1] is 0 if the image is not tiled and else the
                    // negative height.
                    startCenter[1] += this.extent[1];
                }

                return startCenter;
            },
            projection: function () {
                return new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent
                });
            },
            selectedFeatures: function () {
                return selectInteraction ? selectInteraction.getFeatures() : [];
            },
            isDefaultInteractionMode: function () {
                return this.interactionMode === 'default';
            },
            isDrawing: function () {
                return this.interactionMode.startsWith('draw');
            },
            isDrawingPoint: function () {
                return this.interactionMode === 'drawPoint';
            },
            isDrawingRectangle: function () {
                return this.interactionMode === 'drawRectangle';
            },
            isDrawingCircle: function () {
                return this.interactionMode === 'drawCircle';
            },
            isDrawingLineString: function () {
                return this.interactionMode === 'drawLineString';
            },
            isDrawingPolygon: function () {
                return this.interactionMode === 'drawPolygon';
            },
            isDrawingEllipse: function () {
                return this.interactionMode === 'drawEllipse';
            },
            isTranslating: function () {
                return this.interactionMode === 'translate';
            },
            isMagicWanding: function () {
                return this.interactionMode === 'magicWand';
            },
            isAttaching: function () {
                return this.interactionMode === 'attach';
            },
            hasNoSelectedLabel: function () {
                return !this.selectedLabel;
            },
            hasSelectedAnnotations: function () {
                return this.selectedAnnotations.length > 0;
            },
            hasLastCreatedAnnotation: function () {
                return this.lastCreatedAnnotation !== null;
            },
            previousButtonTitle: function () {
                switch (this.cycleMode) {
                    case 'volare':
                        return 'Previous annotation';
                    case 'lawnmower':
                        return 'Previous image section';
                    default:
                        return 'Previous image';
                }
            },
            nextButtonTitle: function () {
                switch (this.cycleMode) {
                    case 'volare':
                        return 'Next annotation';
                    case 'lawnmower':
                        return 'Next image section';
                    default:
                        return 'Next image';
                }
            },
            isLawnmowerCycleMode: function () {
                return this.cycleMode === 'lawnmower';
            },
        },
        methods: {
            updateMapSize: function () {
                this.mapSize = map.getSize();
            },
            invertPointsYAxis: function (points) {
                // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
                // the points based on the type of the image that is currently displayed
                // (single or tiled). CAUTION: Modifies the array in place!
                //
                // If the image is tiled the y axis should be negated because the
                // coordinates of the OL Zoomify source are computed in a weird way.
                //
                // If it is a single image the y axis should be switched from "top to
                // bottom" to "bottom to top" or vice versa. Our database expects ttb,
                // OpenLayers expects btt.

                // extent[3] is 0 for a tiled image so this does exactly what we want.
                var height = this.extent[3];
                for (var i = 1; i < points.length; i += 2) {
                    points[i] = height - points[i];
                }

                return points;
            },
            convertPointsFromOlToDb: function (points) {
                // Merge the individual point arrays to a single array first.
                // [[x1, y1], [x2, y2]] -> [x1, y1, x2, y2]
                return this.invertPointsYAxis(Array.prototype.concat.apply([], points));
            },
            convertPointsFromDbToOl: function (points) {
                // Duplicate the points array because we don't want to modify the
                // original array.
                points = this.invertPointsYAxis(points.slice());
                var newPoints = [];
                for (var i = 0; i < points.length; i += 2) {
                    newPoints.push([
                        points[i],
                        // Circles have no fourth point so we take 0.
                        (points[i + 1] || 0)
                    ]);
                }

                return newPoints;
            },
            // Determines the OpenLayers geometry object for an annotation.
            getGeometry: function (annotation) {
                var points = this.convertPointsFromDbToOl(annotation.points);

                switch (annotation.shape) {
                    case 'Point':
                        return new ol.geom.Point(points[0]);
                    case 'Rectangle':
                        return new ol.geom.Rectangle([points]);
                    case 'Polygon':
                        return new ol.geom.Polygon([points]);
                    case 'LineString':
                        return new ol.geom.LineString(points);
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        return new ol.geom.Circle(points[0], points[1][0]);
                    case 'Ellipse':
                        return new ol.geom.Ellipse([points]);
                    default:
                        // unsupported shapes are ignored
                        console.error('Unknown annotation shape: ' + annotation.shape);
                        return;
                }
            },
            // Creates an OpenLayers feature object from an annotation.
            createFeature: function (annotation) {
                var feature = new ol.Feature(this.getGeometry(annotation));

                feature.setId(annotation.id);
                feature.set('annotation', annotation);
                if (annotation.labels && annotation.labels.length > 0) {
                    feature.set('color', annotation.labels[0].label.color);
                }

                return feature;
            },
            handleFeatureModifyStart: function (e) {
                e.features.forEach(function (feature) {
                    featureRevisionMap[feature.getId()] = feature.getRevision();
                });
            },
            handleFeatureModifyEnd: function (e) {
                var self = this;
                var annotations = e.features.getArray()
                    .filter(function (feature) {
                        return featureRevisionMap[feature.getId()] !== feature.getRevision();
                    })
                    .map(function (feature) {
                        return {
                            id: feature.getId(),
                            image_id: feature.get('annotation').image_id,
                            points: self.getPoints(feature.getGeometry()),
                        };
                    });

                if (annotations.length > 0) {
                    this.$emit('update', annotations);
                }
            },
            focusAnnotation: function (annotation, fast) {
                var feature = annotationSource.getFeatureById(annotation.id);
                if (feature) {
                    if (fast) {
                        delete this.viewFitOptions.duration;
                    } else {
                        this.viewFitOptions.duration = 250;
                    }
                    map.getView().fit(feature.getGeometry(), this.viewFitOptions);
                }
            },
            fitImage: function () {
                map.getView().fit(this.extent, map.getSize());
            },
            extractAnnotationFromFeature: function (feature) {
                return feature.get('annotation');
            },
            handleFeatureSelect: function (event) {
                this.$emit('select',
                    event.selected.map(this.extractAnnotationFromFeature),
                    event.deselected.map(this.extractAnnotationFromFeature)
                );
            },
            handlePrevious: function () {
                this.$emit('previous');
            },
            handleNext: function () {
                this.$emit('next');
            },
            resetInteractionMode: function () {
                this.interactionMode = 'default';
            },
            draw: function (name) {
                if (this['isDrawing' + name]) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'draw' + name;
                }
            },
            drawPoint: function () {
                this.draw('Point');
            },
            drawRectangle: function () {
                this.draw('Rectangle');
            },
            drawCircle: function () {
                this.draw('Circle');
            },
            drawLineString: function () {
                this.draw('LineString');
            },
            drawPolygon: function () {
                this.draw('Polygon');
            },
            drawEllipse: function () {
                this.draw('Ellipse');
            },
            // Assembles the points array depending on the OpenLayers geometry type.
            getPoints: function (geometry) {
                var points;
                switch (geometry.getType()) {
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        points = [geometry.getCenter(), [geometry.getRadius()]];
                        break;
                    case 'Polygon':
                    case 'Rectangle':
                    case 'Ellipse':
                        points = geometry.getCoordinates()[0];
                        break;
                    case 'Point':
                        points = [geometry.getCoordinates()];
                        break;
                    default:
                        points = geometry.getCoordinates();
                }

                return this.convertPointsFromOlToDb(points);
            },
            handleNewFeature: function (e) {
                if (this.hasNoSelectedLabel) {
                    annotationSource.removeFeature(e.feature);
                } else {
                    var geometry = e.feature.getGeometry();
                    e.feature.set('color', this.selectedLabel.color);

                    // This callback is called in case saving the annotation failed.
                    // If saving the annotation succeeded, the temporary feature will
                    // be removed during the reactive update of the annotations property.
                    var removeCallback = function () {
                        annotationSource.removeFeature(e.feature);
                    };

                    this.$emit('new', {
                        shape: geometry.getType(),
                        points: this.getPoints(geometry),
                    }, removeCallback);
                }
            },
            deleteSelectedAnnotations: function () {
                if (this.hasSelectedAnnotations && confirm('Are you sure you want to delete all selected annotations?')) {
                    this.$emit('delete', this.selectedAnnotations);
                }
            },
            deleteLastCreatedAnnotation: function () {
                if (this.hasLastCreatedAnnotation) {
                    this.$emit('delete', [this.lastCreatedAnnotation]);
                }
            },
            toggleTranslating: function () {
                if (this.isTranslating) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'translate';
                }
            },
            toggleAttaching: function () {
                if (this.isAttaching) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'attach';
                }
            },
            toggleMagicWand: function () {
                if (this.isMagicWanding) {
                    this.resetInteractionMode();
                } else if (magicWandInteraction) {
                    this.interactionMode = 'magicWand';
                }
            },
            handleAttachLabel: function (e) {
                this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
            },
            requireSelectedLabel: function () {
                biigle.$require('events').$emit('sidebar.open', 'labels');
                biigle.$require('messages.store').info('Please select a label first.');
                this.resetInteractionMode();
            },
            handleNewInteractionMode: function (mode) {
                if (drawInteraction) {
                    map.removeInteraction(drawInteraction);
                }
                selectInteraction.setActive(false);
                modifyInteraction.setActive(false);
                translateInteraction.setActive(false);
                attachLabelInteraction.setActive(false);
                if (magicWandInteraction) {
                    magicWandInteraction.setActive(false);
                }

                if (this.isDrawing) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else {
                        drawInteraction = new ol.interaction.Draw({
                            source: annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        map.addInteraction(drawInteraction);
                    }
                } else if (this.isAttaching) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else {
                        attachLabelInteraction.setActive(true);
                    }
                } else if (this.isMagicWanding) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else if (magicWandInteraction) {
                        magicWandInteraction.setActive(true);
                    }
                } else {
                    switch (mode) {
                        case 'translate':
                            selectInteraction.setActive(true);
                            translateInteraction.setActive(true);
                            break;
                        default:
                            selectInteraction.setActive(true);
                            modifyInteraction.setActive(true);
                    }
                }

                if (this.showAnnotationTooltip) {
                    if (this.isDefaultInteractionMode) {
                        map.on('pointermove', this.updateHoveredAnnotations);
                        map.on('pointermove', this.updateMouseDomPosition);
                    } else {
                        map.un('pointermove', this.updateHoveredAnnotations);
                        map.un('pointermove', this.updateMouseDomPosition);
                        this.resetHoveredAnnotations();
                    }
                }
            },
            render: function () {
                if (map) {
                    map.render();
                }
            },
            // Calculate the center point of an image section based on its index in x and
            // y direction (e.g. [0, 0] for the first section).
            getImageSectionCenter: function (section) {
                return [
                    section[0] * this.imageSectionStepSize[0] + this.imageSectionStartCenter[0],
                    section[1] * this.imageSectionStepSize[1] + this.imageSectionStartCenter[1],
                ];
            },
            showImageSection: function (section) {
                if (section[0] < this.imageSectionSteps[0] && section[1] < this.imageSectionSteps[1] && section[0] >= 0 && section[1] >= 0) {
                    this.imageSection = section;
                    // Don't make imageSectionCenter a computed property because it
                    // would automatically update when the resolution changes. But we
                    // need the old value to compute the new image section in the
                    // resolution watcher first!
                    this.imageSectionCenter = this.getImageSectionCenter(section);
                    map.getView().setCenter(this.imageSectionCenter);
                    return true;
                }

                return false;
            },
            showLastImageSection: function () {
                this.showImageSection([
                    this.imageSectionSteps[0] - 1,
                    this.imageSectionSteps[1] - 1,
                ]);
            },
            showFirstImageSection: function () {
                this.showImageSection([0, 0]);
            },
            showPreviousImageSection: function () {
                var x = this.imageSection[0] - 1;
                if (x >= 0) {
                    return this.showImageSection([x, this.imageSection[1]]);
                } else {
                    return this.showImageSection([
                        this.imageSectionSteps[0] - 1,
                        this.imageSection[1] - 1,
                    ]);
                }
            },
            showNextImageSection: function () {
                var x = this.imageSection[0] + 1;
                if (x < this.imageSectionSteps[0]) {
                    return this.showImageSection([x, this.imageSection[1]]);
                } else {
                    return this.showImageSection([0, this.imageSection[1] + 1]);
                }
            },
            updateMouseDomPosition: function (e) {
                this.mouseDomPosition = e.pixel;
            },
            updateMousePosition: function (e) {
                var self = this;
                biigle.$require('annotations.stores.utils').throttle(function () {
                    self.mousePosition = self.invertPointsYAxis(e.coordinate).map(Math.round);
                }, 100, 'annotations.canvas.mouse-position');
            },
            updateHoveredAnnotations: function (e) {
                var annotations = [];
                map.forEachFeatureAtPixel(e.pixel,
                    function (feature) {
                        if (feature.get('annotation')) {
                            annotations.push(feature.get('annotation'));
                        }
                    },
                    {
                        layerFilter: function (layer) {
                            return layer === annotationLayer;
                        }
                    }
                );

                var hash = annotations.map(function (a) {return a.id;}).sort().join('');

                if (this.hoveredAnnotationHash !== hash) {
                    this.hoveredAnnotationHash = hash;
                    this.hoveredAnnotations = annotations;
                }
            },
            resetHoveredAnnotations: function () {
                this.hoveredAnnotationHash = '';
                this.hoveredAnnotations = [];
            },
            handleRegularImage: function (image, oldImage) {
                if (!image) {
                    imageLayer.setSource(null);
                } else {
                    if (!oldImage || oldImage.width !== image.width || oldImage.height !== image.height) {
                        // image.canvas points to the same object for all images for
                        // performance reasons. Because of this we only have to update
                        // the source if the image dimensions have changed. The content
                        // of the canvas element will be automatically updated.
                        imageLayer.setSource(new ol.source.Canvas({
                            canvas: image.canvas,
                            projection: this.projection,
                            canvasExtent: this.extent,
                            canvasSize: [image.width, image.height]
                        }));
                    }

                    // The same performance optimizations mentioned above make the magic
                    // wand interaction unable to detect any change if the image is
                    // switched. So if the interaction is currently active we have to
                    // update it manually here.
                    if (this.isMagicWanding) {
                        magicWandInteraction.updateSnapshot();
                    }
                }
            },
            handleTiledImage: function (image, oldImage) {
                if (!image) {
                    tiledImageLayer.setSource(null);
                } else {
                    tiledImageLayer.setSource(new ol.source.Zoomify({
                        url: image.url,
                        size: [image.width, image.height],
                        transition: 100,
                    }));
                }
            },
        },
        watch: {
            image: function (image, oldImage) {
                if (image.tiled === true) {
                    if (!oldImage || oldImage.tiled !== true) {
                        map.removeLayer(imageLayer);
                        map.addLayer(tiledImageLayer);
                        if (magicWandInteraction) {
                            magicWandInteraction.setLayer(tiledImageLayer);
                        }
                    }

                    this.handleTiledImage(image, oldImage);
                } else {
                    if (!oldImage || oldImage.tiled === true) {
                        map.removeLayer(tiledImageLayer);
                        map.addLayer(imageLayer);
                        if (magicWandInteraction) {
                            magicWandInteraction.setLayer(imageLayer);
                        }
                    }

                    this.handleRegularImage(image, oldImage);
                }
            },
            annotations: function (annotations) {
                var annotationsMap = {};
                annotations.forEach(function (annotation) {
                    annotationsMap[annotation.id] = null;
                });

                var oldFeaturesMap = {};
                var oldFeatures = annotationSource.getFeatures();
                var removedFeatures = oldFeatures.filter(function (feature) {
                    oldFeaturesMap[feature.getId()] = null;
                    return !annotationsMap.hasOwnProperty(feature.getId());
                });

                if (removedFeatures.length === oldFeatures.length) {
                    // In case we switched the images, we want to clear and redraw all
                    // features.
                    annotationSource.clear(true);
                } else {
                    // In case annotations were added/removed, we only want to update the
                    // changed features.
                    removedFeatures.forEach(function (feature) {
                        annotationSource.removeFeature(feature);
                    });

                    annotations = annotations.filter(function (annotation) {
                        return !oldFeaturesMap.hasOwnProperty(annotation.id);
                    });
                }

                annotationSource.addFeatures(annotations.map(this.createFeature));
                this.resetHoveredAnnotations();
            },
            selectedAnnotations: function (annotations) {
                var source = annotationSource;
                var features = this.selectedFeatures;
                features.clear();
                annotations.forEach(function (annotation) {
                    features.push(source.getFeatureById(annotation.id));
                });
            },
            extent: function (extent, oldExtent) {
                // The extent only truly changes if the width and height changed.
                // extent[0] is always 0, the others vary depending on the image type
                // (regular or tiled).
                if (extent[1] === oldExtent[1] && extent[2] === oldExtent[2] && extent[3] === oldExtent[3]) {
                    return;
                }

                var center = ol.extent.getCenter(extent);

                // Only use this.center once on initialization. If the extent changes
                // afterwards, the center should be reset.
                if (!this.initialized) {
                    center = this.center || center;
                    this.initialized = true;
                }

                // Leave this undefined if the current image is not tiled.
                var resolutions;

                if (this.image.tiled === true) {
                    resolutions = tiledImageLayer.getSource().getTileGrid().getResolutions();
                }

                map.setView(new ol.View({
                    projection: this.projection,
                    center: center,
                    resolution: this.resolution,
                    resolutions: resolutions,
                    zoomFactor: 1.5,
                    // Allow a maximum of 4x magnification for non-tiled images.
                    minResolution: 0.25,
                    // Restrict movement.
                    extent: extent
                }));

                if (this.resolution === undefined) {
                    map.getView().fit(extent);
                }
            },
            selectedLabel: function (label) {
                if (!label) {
                    if (this.isDrawing || this.isAttaching) {
                        this.resetInteractionMode();
                    }
                }
            },
            annotationOpacity: function (opacity) {
                annotationLayer.setOpacity(opacity);
            },
            // Update the current image section if either the resolution or the map size
            // changed. viewExtent depends on both so we can use it as watcher.
            viewExtent: function () {
                if (!this.isLawnmowerCycleMode || !Number.isInteger(this.imageSectionSteps[0]) || !Number.isInteger(this.imageSectionSteps[1])) {
                    return;
                }
                var distance = function (p1, p2) {
                    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                };

                var nearest = Infinity;
                var current = 0;
                var nearestStep = [0, 0];
                for (var y = 0; y < this.imageSectionSteps[1]; y++) {
                    for (var x = 0; x < this.imageSectionSteps[0]; x++) {
                        current = distance(this.imageSectionCenter, this.getImageSectionCenter([x, y]));
                        if (current < nearest) {
                            nearestStep[0] = x;
                            nearestStep[1] = y;
                            nearest = current;
                        }
                    }
                }

                this.showImageSection(nearestStep);
            },
            showMousePosition: function (show) {
                if (show) {
                    map.on('pointermove', this.updateMousePosition);
                } else {
                    map.un('pointermove', this.updateMousePosition);
                }
            },
            showAnnotationTooltip: function (show) {
                if (show) {
                    map.on('pointermove', this.updateMouseDomPosition);
                    map.on('pointermove', this.updateHoveredAnnotations);
                } else {
                    map.un('pointermove', this.updateMouseDomPosition);
                    map.un('pointermove', this.updateHoveredAnnotations);
                    this.resetHoveredAnnotations();
                }
            },
        },
        created: function () {
            var self = this;
            styles = biigle.$require('annotations.stores.styles');
            map = biigle.$require('annotations.stores.map');

            annotationLayer.setStyle(styles.features);
            map.addLayer(annotationLayer);

            biigle.$require('events').$on('sidebar.toggle', function () {
                self.$nextTick(function () {
                    map.updateSize();
                });
            });

            map.on('moveend', function (e) {
                var view = map.getView();
                self.$emit('moveend', {
                    center: view.getCenter(),
                    resolution: view.getResolution(),
                });
            });

            map.on('change:size', this.updateMapSize);

            // We initialize this here because we need to make sure the styles are
            // properly loaded and there is no setStyle() function like for the
            // annotationLayer.
            selectInteraction = new ol.interaction.Select({
                // Use click instead of default singleclick because the latter is delayed
                // 250ms to ensure the event is no doubleclick. But we want it to be as
                // fast as possible.
                condition: ol.events.condition.click,
                style: styles.highlight,
                layers: [annotationLayer],
                // enable selecting multiple overlapping features at once
                multi: true
            });

            selectInteraction.on('select', this.handleFeatureSelect);
            map.addInteraction(selectInteraction);

            var keyboard = biigle.$require('keyboard');
            // Space bar.
            keyboard.on(32, this.handleNext);
            // Arrow right key.
            keyboard.on(39, this.handleNext);
            // Arrow left key.
            keyboard.on(37, this.handlePrevious);
            // Esc key.
            keyboard.on(27, this.resetInteractionMode);

            if (this.editable) {
                modifyInteraction = new ol.interaction.Modify({
                    features: selectInteraction.getFeatures(),
                    // She Shift key must be pressed to delete vertices, so that new
                    // vertices can be drawn at the same position of existing vertices.
                    deleteCondition: function(event) {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    },
                });
                modifyInteraction.on('modifystart', this.handleFeatureModifyStart);
                modifyInteraction.on('modifyend', this.handleFeatureModifyEnd);
                map.addInteraction(modifyInteraction);

                var ExtendedTranslateInteraction = biigle.$require('annotations.ol.ExtendedTranslateInteraction');
                translateInteraction = new ExtendedTranslateInteraction({
                    features: selectInteraction.getFeatures(),
                    map: map,
                });
                translateInteraction.setActive(false);
                translateInteraction.on('translatestart', this.handleFeatureModifyStart);
                translateInteraction.on('translateend', this.handleFeatureModifyEnd);
                map.addInteraction(translateInteraction);

                var AttachLabelInteraction = biigle.$require('annotations.ol.AttachLabelInteraction');
                attachLabelInteraction = new AttachLabelInteraction({
                    features: annotationFeatures,
                    map: map,
                });
                attachLabelInteraction.setActive(false);
                attachLabelInteraction.on('attach', this.handleAttachLabel);
                map.addInteraction(attachLabelInteraction);

                if (this.crossOrigin) {
                    keyboard.on('g', this.drawPolygon);
                } else {
                    // Magic wand interaction is not available for remote images.
                    var MagicWandInteraction = biigle.$require('annotations.ol.MagicWandInteraction');
                    magicWandInteraction = new MagicWandInteraction({
                        map: map,
                        source: annotationSource,
                        style: styles.editing,
                        indicatorPointStyle: styles.editing,
                        indicatorCrossStyle: styles.cross,
                        simplifyTolerant: 0.1,
                    });
                    magicWandInteraction.on('drawend', this.handleNewFeature);
                    magicWandInteraction.setActive(false);
                    map.addInteraction(magicWandInteraction);

                    keyboard.on('g', function (e) {
                        if (e.shiftKey) {
                            self.toggleMagicWand();
                        } else {
                            self.drawPolygon();
                        }
                    });
                }

                // Del key.
                keyboard.on(46, this.deleteSelectedAnnotations);
                // Backspace key.
                keyboard.on(8, this.deleteLastCreatedAnnotation);

                keyboard.on('a', this.drawPoint);
                keyboard.on('s', this.drawRectangle);
                keyboard.on('d', function (e) {
                    if (e.shiftKey) {
                        self.drawEllipse();
                    } else {
                        self.drawCircle();
                    }
                });
                keyboard.on('f', this.drawLineString);
                keyboard.on('m', this.toggleTranslating);
                keyboard.on('l', this.toggleAttaching);

                this.$watch('interactionMode', this.handleNewInteractionMode);
            }
        },
        mounted: function () {
            map.setTarget(this.$el);
        },
    };
});

/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationTooltip', {
    props: {
        annotations: {
            required: true,
            type: Array,
        },
        position: {
            required: true,
            type: Array,
        },
    },
    data: function () {
        return {
            delayPast: false,
        };
    },
    computed: {
        shown: function () {
            return this.annotations.length > 0;
        },
        styleObject: function () {
            return 'transform: translate(' + this.position[0] + 'px,' + this.position[1] + 'px);';
        },
        classObject: function () {
            return {
                'annotation-tooltip--shown': this.shown,
            };
        },
    },
});

/**
 * The filter component of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsFilter', {
    components: {
        typeahead: biigle.$require('core.components.typeahead'),
    },
    props: {
        annotations: {
            type: Array,
            required: true,
        },
    },
    data: function () {
        return {
            availableFilters: ['label', 'user', 'shape', 'session'],
            selectedFilter: null,
            selectedData: null,
            active: false,
        };
    },
    computed: {
        placeholder: function () {
            if (this.selectedFilter) {
                return this.selectedFilter + ' name';
            }

            return 'filter annotations';
        },
        labelData: function () {
            // Use this map to get unique labels only.
            var map = {};
            var data = [];
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.label.id] = annotationLabel.label;
                });
            });

            for (var id in map) {
                if (map.hasOwnProperty(id)) {
                    data.push(map[id]);
                }
            }

            return data;
        },
        userData: function () {
            // Use this map to get unique users only.
            var map = {};
            var data = [];
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.user.id] = annotationLabel.user;
                });
            });

            for (var id in map) {
                if (map.hasOwnProperty(id)) {
                    map[id].name = map[id].firstname + ' ' + map[id].lastname;
                    data.push(map[id]);
                }
            }

            return data;
        },
        shapeData: function () {
            var shapes = biigle.$require('annotations.shapes');
            var data = [];
            for (var id in shapes) {
                if (shapes.hasOwnProperty(id)) {
                    data.push({id: parseInt(id, 10), name: shapes[id]});
                }
            }

            return data;
        },
        sessionData: function () {
            return biigle.$require('annotations.sessions').map(function (session) {
                session.starts_at = new Date(session.starts_at);
                session.ends_at = new Date(session.ends_at);

                return session;
            });
        },
        data: function () {
            if (this.selectedFilter) {
                return this[this.selectedFilter + 'Data'] || [];
            }

            return [];
        },
        selectedDataName: function () {
            return this.selectedData ? this.selectedData.name : '';
        },
    },
    methods: {
        labelFilterFunction: function (label) {
            return function (annotation) {
                return annotation.labels.filter(function (annotationLabel) {
                    return annotationLabel.label.id === label.id;
                }).length > 0;
            };
        },
        userFilterFunction: function (user) {
            return function (annotation) {
                return annotation.labels.filter(function (annotationLabel) {
                    return annotationLabel.user.id === user.id;
                }).length > 0;
            };
        },
        shapeFilterFunction: function (shape) {
            return function (annotation) {
                return annotation.shape_id === shape.id;
            };
        },
        sessionFilterFunction: function (session) {
            var userMap = {};
            session.users.forEach(function (user) {
                userMap[user.id] = null;
            });

            return function (annotation) {
                /*
                 * Dates without timezone (like these) are interpreted as dates of the
                 * timezone of the browser. Since the application can run in any
                 * timezone, these dates may not be interpreted correctly. But since the
                 * dates of the annotation session are not interpreted correctly, too
                 * (in the same way), we can still use them for comparison. Just be sure
                 * not to use the iso_8601 dates of the annotation session for
                 * comparison with the dates of the annotations.
                 */
                for (var i = annotation.labels.length - 1; i >= 0; i--) {
                    if (userMap.hasOwnProperty(annotation.labels[i].user.id)) {
                        // If the annotation has a label of a user that belongs to the
                        // session, it is valid if created_at belongs to the session,
                        // too.
                        var created_at = new Date(annotation.created_at);

                        return created_at >= session.starts_at && created_at < session.ends_at;
                    }
                }

                return false;
            };
        },
        selectData: function (data) {
            this.selectedData = data;
            this.activateFilter();
        },
        activateFilter: function () {
            if (this.selectedFilter && this.selectedData) {
                this.active = true;
                this.$emit('filter', this[this.selectedFilter + 'FilterFunction'](this.selectedData));
            }
        },
        deactivateFilter: function () {
            this.active = false;
            this.selectedData = null;
            this.$emit('filter', null);
        },
    },
});

/**
 * The annotations tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTab', {
    components: {
        labelItem: biigle.$require('annotations.components.annotationsTabItem'),
        annotationsFilter: biigle.$require('annotations.components.annotationsFilter'),
    },
    props: {
        annotations: {
            type: Array,
            required: true,
        },
        filteredAnnotations: {
            type: Array,
            required: true,
        },
    },
    computed: {
        // Compiles a list of all labels and their associated annotations.
        items: function () {
            var labels = [];
            var annotations = {};
            this.filteredAnnotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    var item = {
                        annotation: annotation,
                        annotationLabel: annotationLabel,
                    };

                    if (annotations.hasOwnProperty(annotationLabel.label.id)) {
                        annotations[annotationLabel.label.id].push(item);
                    } else {
                        annotations[annotationLabel.label.id] = [item];
                        labels.push(annotationLabel.label);
                    }
                });
            });

            // Sort labels alphabetically in the sidebar.
            return labels.sort(this.sortByName)
                .map(function (label) {
                    return {
                        label: label,
                        annotations: annotations[label.id]
                    };
                });
        },
    },
    methods: {
        sortByName: function (a, b) {
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
        },
        reallyScrollIntoView: function (annotations) {
            var scrollElement = this.$refs.scrollList;
            var scrollTop = scrollElement.scrollTop;
            var height = scrollElement.offsetHeight;
            var top = Infinity;
            var bottom = 0;

            var element;
            annotations.forEach(function (annotation) {
                var elements = scrollElement.querySelectorAll(
                    '[data-annotation-id="' + annotation.id + '"]'
                );
                for (var i = elements.length - 1; i >= 0; i--) {
                    element = elements[i];
                    top = Math.min(element.offsetTop, top);
                    bottom = Math.max(element.offsetTop + element.offsetHeight, bottom);
                }
            }, this);

            // Scroll scrollElement so all list items of selected annotations are
            // visible or scroll to the first list item if all items don't fit inside
            // scrollElement.
            if (scrollTop > top) {
                scrollElement.scrollTop = top;
            } else if ((scrollTop + height) < bottom) {
                if (height >= (bottom - top)) {
                    scrollElement.scrollTop = bottom - scrollElement.offsetHeight;
                } else {
                    scrollElement.scrollTop = top;
                }
            }
        },
        // If an annotation is selected on the map the respective annotation labels
        // should be visible in the annotations tab, too. This function adjusts the
        // scrollTop of the list so all selected annotation labels are visible (if
        // possible).
        scrollIntoView: function (annotations) {
            if (annotations.length === 0) {
                return;
            }

            // Wait for the annotations list to be rendered so the offsetTop of each
            // item can be determined.
            this.$nextTick(function () {
                this.reallyScrollIntoView(annotations);
            });
        },
        // If an annotation label is selected it may be that a preceding annotation item
        // expands which would push the currently selected annotation label down. This
        // function adjusts the scrollTop so the selected annotation label stays at the
        // same position relative to the cursor.
        keepElementPosition: function (element) {
            var scrollElement = this.$refs.scrollList;
            var positionBefore = element.offsetTop - scrollElement.scrollTop;
            // Wait until everything is rendered.
            this.$nextTick(function () {
                this.$nextTick(function () {
                    var positionAfter = element.offsetTop - scrollElement.scrollTop;
                    // Scroll so the element has the same relative position than before.
                    scrollElement.scrollTop += positionAfter - positionBefore;
                });
            });
        },
        bubbleFilter: function (filter) {
            this.$emit('filter', filter);
        },
    },
});

/**
 * One list item of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTabItem', {
    components: {
        annotationItem: biigle.$require('annotations.components.annotationsTabSubItem'),
    },
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    data: function () {
        return {
            isOpen: false,
        };
    },
    computed: {
        label: function () {
            return this.item.label;
        },
        annotationItems: function () {
            return this.item.annotations;
        },
        count: function () {
            return this.annotationItems.length;
        },
        hasSelectedAnnotation: function () {
            var items = this.annotationItems;
            for (var i = items.length - 1; i >= 0; i--) {
                if (items[i].annotation.selected === true) {
                    return true;
                }
            }

            return false;
        },
        isSelected: function () {
            return this.isOpen || this.hasSelectedAnnotation;
        },
        classObject: function () {
            return {
                selected: this.isSelected,
            };
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        title: function () {
            return 'List all annotations with label ' + this.label.name;
        },
        countTitle: function () {
            return 'There are ' + this.count + ' annotations with this label';
        },
    },
    methods: {
        toggleOpen: function () {
            this.isOpen = !this.isOpen;
        },
        bubbleSelect: function (element) {
            this.$emit('select', element);
        },
    },
});

/**
 * One sub-list item of a list item of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTabSubItem', {
    props: {
        item: {
            type: Object,
            required: true,
        },
        userId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        annotation: function () {
            return this.item.annotation;
        },
        label: function () {
            return this.item.annotationLabel;
        },
        isSelected: function () {
            return this.annotation.selected;
        },
        classObject: function () {
            return {
                selected: this.isSelected,
            };
        },
        shapeClass: function () {
            return 'icon-' + this.annotation.shape.toLowerCase();
        },
        username: function () {
            if (this.label.user) {
                return this.label.user.firstname + ' ' + this.label.user.lastname;
            }

            return '(user deleted)';
        },
        canBeDetached: function () {
            return this.label.user && this.label.user.id === this.userId;
        },
        events: function () {
            return biigle.$require('events');
        },
    },
    methods: {
        toggleSelect: function (e) {
            this.$emit('select', this.$el);

            if (this.isSelected) {
                this.events.$emit('annotations.deselect', this.annotation, e);
            } else {
                this.events.$emit('annotations.select', this.annotation, e);
            }
        },
        focus: function () {
            this.events.$emit('annotations.focus', this.annotation);
        },
        detach: function () {
            if (this.annotation.labels.length > 1) {
                this.events.$emit('annotations.detachLabel', this.annotation, this.label);
            } else if (confirm('Detaching the last label will delete the annotation. Proceed?')) {
                this.events.$emit('annotations.delete', this.annotation);
            }
        },
    },
});

/**
 * The color adjustment tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.colorAdjustmentTab', {
    data: function () {
        return {
            isBrightnessRgbActive: false,
            colorAdjustment: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
            },
        };
    },
    methods: {
        resetType: function (type, index) {
            if (index !== undefined) {
                // Use splice so Vue is able to detect the change.
                this.colorAdjustment[type].splice(index, 1, 0);
            } else {
                this.colorAdjustment[type] = this.colorAdjustment[type].map(function () {
                    return 0;
                });
            }
        },
        reset: function () {
            for (var type in this.colorAdjustment) {
                if (this.colorAdjustment.hasOwnProperty(type)) {
                    this.resetType(type);
                }
            }
        },
        toggleBrightnessRgb: function () {
            if (this.isBrightnessRgbActive) {
                this.resetType('brightnessRGB');
            } else {
                this.resetType('brightnessContrast', 0);
            }
            this.isBrightnessRgbActive = !this.isBrightnessRgbActive;
        },
    },
    watch: {
        colorAdjustment: {
            handler: function () {
                this.$emit('change', this.colorAdjustment);
            },
            deep: true,
        },
    },
});

/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.controlButton', {
    template: '<span class="control-button btn" :title="title" :class="classObject" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">' +
        '<i :class="iconClass" aria-hidden="true"></i>' +
        '<span v-if="hasSubControls" @click.stop class="control-button__sub-controls btn-group">' +
            '<slot></slot>' +
        '</span>' +
    '</span>',
    props: {
        title: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            mouseOver: false,
            timeout: null,
            activeSubControls: 0,
        };
    },
    computed: {
        classObject: function () {
            return {
                active: this.active,
                'control-button--open': this.showSubControls,
            };
        },
        iconClass: function () {
            if (this.icon.startsWith('glyphicon-')) {
                return 'glyphicon ' + this.icon;
            } else if (this.icon.startsWith('fa-')) {
                return 'fa ' + this.icon;
            }

            return 'icon icon-white ' + this.icon;
        },
        hasSubControls: function () {
            return this.$slots.hasOwnProperty('default');
        },
        showSubControls: function () {
            return this.mouseOver || this.hasActiveSubControl;
        },
        hasActiveSubControl: function () {
            return this.activeSubControls > 0;
        },
    },
    methods: {
        handleClick: function () {
            this.$emit('click');
        },
        handleMouseEnter: function () {
            this.mouseOver = true;
            window.clearTimeout(this.timeout);
        },
        handleMouseLeave: function () {
            var self = this;
            window.clearTimeout(this.timeout);
            this.timeout = window.setTimeout(function () {
                self.mouseOver = false;
            }, 200);
        },
        updateActiveSubControls: function (active) {
            if (active) {
                this.activeSubControls++;
            } else {
                this.activeSubControls--;
            }
        }
    },
    watch: {
        active: function (active) {
            this.$parent.$emit('control-button-active', active);
        },
    },
    created: function () {
        this.$on('control-button-active', this.updateActiveSubControls);
    },
});

/**
 * The label indicator of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.labelIndicator', {
    props: {
        label: {
            required: true,
        },
    },
});

/**
 * The labels tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.labelsTab', {
    components: {
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
    },
    data: function () {
        return {
            labelTrees: biigle.$require('annotations.labelTrees'),
            selectedLabel: null,
        };
    },
    computed: {
        plugins: function () {
            return biigle.$require('annotations.components.labelsTabPlugins');
        },
    },
    methods: {
        handleSelectedLabel: function (label) {
            this.selectedLabel = label;
            this.$emit('select', label);
        },
        handleDeselectedLabel: function (label) {
            this.selectedLabel = null;
            this.$emit('select', null);
        },
    }
});

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsLabelsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
biigle.$declare('annotations.components.labelsTabPlugins', {});

/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.minimap', function () {
    var initialized = false;
    var minimap = new ol.Map({
        // remove controls
        controls: [],
        // disable interactions
        interactions: []
    });

    var viewportSource = new ol.source.Vector();
    var viewport = new ol.Feature();
    viewportSource.addFeature(viewport);

    var mapView, mapSize;

    return {
        props: {
            extent: {
                type: Array,
                required: true,
            },
            projection: {
                type: Object,
                required: true,
            },
        },
        computed: {
            // Width and height are only evaluated once on initialization. They will be
            // used to calculate the actual minimap size based on the image aspect ratio.
            intendedWidth: function () {
                return this.$el.clientWidth;
            },
            intendedHeight: function () {
                return this.$el.clientHeight;
            },
        },
        methods: {
            // Move the viewport rectangle on the minimap.
            updateViewport: function () {
                viewport.setGeometry(ol.geom.Polygon.fromExtent(mapView.calculateExtent(mapSize)));
            },
            dragViewport: function (e) {
                mapView.setCenter(e.coordinate);
            },
            updateMapSize: function (e) {
                mapSize = e.target.getSize();
            },
            updateMapView: function (e) {
                mapView = e.target.getView();
            },
            updateElementSize: function () {
                var imageWidth = this.extent[2];
                // If extent[3] is 0 then a tiled image is displayed. For this the image
                // height is -extent[1]. This is due to the differences between a Zoomify
                // and an Image source.
                var imageHeight = this.extent[3] || -this.extent[1];

                // Calculate resolution that fits the image into the minimap element.
                var resolution = Math.max(
                    imageWidth / this.intendedWidth,
                    imageHeight / this.intendedHeight
                );
                minimap.setView(new ol.View({
                    projection: this.projection,
                    center: ol.extent.getCenter(this.extent),
                    resolution: resolution,
                }));

                // Update the minimap element size so it has the same dimensions than the
                // image displayed by OpenLayers.
                this.$el.style.width = Math.round(imageWidth / resolution) + 'px';
                this.$el.style.height = Math.round(imageHeight / resolution) + 'px';
                minimap.updateSize();
            },
            refreshImageLayer: function (e) {
                // Set or refresh the layer that displays the image. This is done after
                // the minimap element was created. The annotationCanvas can display
                // either a regular image or a tiled image. If the type changes we have
                // to update the layer here, too.
                var layers = minimap.getLayers();
                if (layers.getLength() > 1) {
                    layers.setAt(0, e.target.item(e.target.getLength() - 1));
                } else {
                    layers.insertAt(0, e.target.item(e.target.getLength() - 1));
                }
            },
        },
        created: function () {
            // Dot this only once and retain the minimap object even if the component
            // is hidden/destroyed.
            if (!initialized) {
                initialized = true;
                var map = biigle.$require('annotations.stores.map');
                mapSize = map.getSize();
                mapView = map.getView();
                map.on('postcompose', this.updateViewport);
                map.on('change:size', this.updateMapSize);
                map.on('change:view', this.updateMapView);

                // Add the viewport layer now. Add the image layer later when it was
                // added to the map.
                minimap.addLayer(new ol.layer.Vector({
                    source: viewportSource,
                    style: biigle.$require('annotations.stores.styles').viewport
                }));
                map.getLayers().on('add', this.refreshImageLayer);
                minimap.on('pointerdrag', this.dragViewport);
                minimap.on('click', this.dragViewport);
            }
        },
        watch: {
            // Refresh the view if the extent (i.e. image size) changed.
            extent: function () {
                this.updateElementSize();
            },
        },
        mounted: function () {
            minimap.setTarget(this.$el);
            this.updateElementSize();
        },
    };
});

/**
 * The mouse position indicator of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.mousePositionIndicator', {
    props: {
        position: {
            required: true,
        },
    },
    computed: {
        positionText: function () {
            return this.position[0] + ' × ' + this.position[1];
        },
    },
});

/**
 * A button that produces a screenshot of the map
 *
 * @type {Object}
 */
biigle.$component('annotations.components.screenshotButton', {
    mixins: [biigle.$require('annotations.mixins.imageFilenameTracker')],
    computed: {
        map: function () {
            return biigle.$require('annotations.stores.map');
        },
        messages: function () {
            return biigle.$require('messages.store');
        },
        screenshotSupported: function () {
            return !biigle.$require('annotations.volumeIsRemote');
        },
        screenshotTitle: function () {
            if (this.screenshotSupported) {
                return 'Get a screenshot of the visible area';
            }

            return 'Screenshots are not available for remote images';
        },
        filename: function () {
            if (this.currentImageFilename) {
                var name = this.currentImageFilename.split('.');
                if (name.length > 1) {
                    name[name.length - 1] = 'png';
                }
                name = name.join('.').toLowerCase();
                return 'biigle_screenshot_' + name;
            }

            return 'biigle_screenshot.png';
        },
    },
    methods: {
        // see: https://gist.github.com/remy/784508
        trimCanvas: function (canvas) {
            var ctx = canvas.getContext('2d');
            var copy = document.createElement('canvas').getContext('2d');
            var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var l = pixels.data.length;
            var i, x, y;
            var bound = {
                top: null,
                left: null,
                right: null,
                bottom: null
            };

            for (i = 0; i < l; i += 4) {
                if (pixels.data[i + 3] !== 0) {
                    x = (i / 4) % canvas.width;
                    y = ~~((i / 4) / canvas.width);

                    if (bound.top === null) {
                        bound.top = y;
                    }

                    if (bound.left === null) {
                        bound.left = x;
                    } else if (x < bound.left) {
                        bound.left = x;
                    }

                    if (bound.right === null) {
                        bound.right = x;
                    } else if (bound.right < x) {
                        bound.right = x;
                    }

                    if (bound.bottom === null) {
                        bound.bottom = y;
                    } else if (bound.bottom < y) {
                        bound.bottom = y;
                    }
                }
            }

            var trimHeight = bound.bottom - bound.top;
            var trimWidth = bound.right - bound.left;
            var trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

            copy.canvas.width = trimWidth;
            copy.canvas.height = trimHeight;
            copy.putImageData(trimmed, 0, 0);

            return copy.canvas;
        },
        makeBlob: function (canvas) {
            try {
                canvas = this.trimCanvas(canvas);
            } catch (error) {
                return Vue.Promise.reject('Could not create screenshot. Maybe the image is not loaded yet?');
            }

            var type = 'image/png';
            if (!HTMLCanvasElement.prototype.toBlob) {
                // fallback if toBlob is not implemented see 'Polyfill':
                // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toBlob
                var binStr = atob(canvas.toDataURL(type).split(',')[1]);
                var len = binStr.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++ ) {
                    arr[i] = binStr.charCodeAt(i);
                }

                return new Vue.Promise(function (resolve) {
                    resolve(new Blob([arr], {type: type}));
                });
            } else {
                return new Vue.Promise(function (resolve) {
                    canvas.toBlob(resolve, type);
                });
            }
        },
        download: function (blob) {
            var a = document.createElement('a');
            a.style = 'display: none';
            a.download = this.filename;
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            window.setTimeout(function () {
                // wait a bit before revoking the blob (else the download might not work)
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 100);
        },
        capture: function () {
            var self = this;
            this.map.once('postcompose', function (e) {
                self.makeBlob(e.context.canvas)
                    .then(self.download)
                    .catch(self.handleError);
            });
            this.map.renderSync();
        },
        handleError: function (message) {
            this.messages.danger(message);
        },
    },
});

/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.settingsTab', {
    components: {
        screenshotButton: biigle.$require('annotations.components.screenshotButton'),
    },
    data: function () {
        return {
            annotationOpacity: 1.0,
            cycleMode: 'default',
            mousePosition: false,
            annotationTooltip: false,
            minimap: true,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('annotations.stores.settings');
        },
        keyboard: function () {
            return biigle.$require('keyboard');
        },
        isVolareActive: function () {
            return this.cycleMode === 'volare';
        },
        isLawnmowerActive: function () {
            return this.cycleMode === 'lawnmower';
        },
        plugins: function () {
            return biigle.$require('annotations.components.settingsTabPlugins');
        },
    },
    methods: {
        startVolare: function () {
            this.cycleMode = 'volare';
        },
        startLawnmower: function () {
            this.cycleMode = 'lawnmower';
        },
        resetCycleMode: function () {
            this.cycleMode = 'default';
        },
        emitAttachLabel: function () {
            this.$emit('attach-label');
        },
        showMousePosition: function () {
            this.mousePosition = true;
        },
        hideMousePosition: function () {
            this.mousePosition = false;
        },
        showAnnotationTooltip: function () {
            this.annotationTooltip = true;
        },
        hideAnnotationTooltip: function () {
            this.annotationTooltip = false;
        },
        showMinimap: function () {
            this.minimap = true;
        },
        hideMinimap: function () {
            this.minimap = false;
        },
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            if (opacity === 1) {
                this.settings.delete('annotationOpacity');
            } else {
                this.settings.set('annotationOpacity', opacity);
            }
            this.$emit('change', 'annotationOpacity', opacity);
        },
        cycleMode: function (mode) {
            this.$emit('change', 'cycleMode', mode);

            if (mode === 'default') {
                this.keyboard.off(27, this.resetCycleMode);
            } else {
                // ESC key.
                this.keyboard.on(27, this.resetCycleMode);
            }

            if (mode === 'volare') {
                // Enter key.
                this.keyboard.on(13, this.emitAttachLabel);
            } else {
                this.keyboard.off(13, this.emitAttachLabel);
            }
        },
        mousePosition: function (show) {
            if (show) {
                this.settings.set('mousePosition', true);
            } else {
                this.settings.delete('mousePosition');
            }
            this.$emit('change', 'mousePosition', show);
        },
        annotationTooltip: function (show) {
            if (show) {
                this.settings.set('annotationTooltip', true);
            } else {
                this.settings.delete('annotationTooltip');
            }
            this.$emit('change', 'annotationTooltip', show);
        },
        minimap: function (show) {
            if (show) {
                this.settings.delete('minimap');
            } else {
                this.settings.set('minimap', false);
            }
            this.$emit('change', 'minimap', show);
        },
    },
    created: function () {
        var storedProperties = [
            'annotationOpacity',
            'mousePosition',
            'annotationTooltip',
            'minimap',
        ];
        storedProperties.forEach(function (property) {
            if (this.settings.has(property)) {
                this[property] = this.settings.get(property);
            }
        }, this);
    },
});

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsSettingsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
biigle.$declare('annotations.components.settingsTabPlugins', {});

/**
 * An extension of the sidebar component that listens on key events.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.sidebar', {
    mixins: [biigle.$require('core.components.sidebar')],
    created: function () {
        var self = this;
        biigle.$require('events').$on('sidebar.open', function (tab) {
            self.$emit('open', tab);
        });
    },
});

/**
 * Store for the annotations of the annotation tool
 */
biigle.$declare('annotations.stores.annotations', function () {
    var events = biigle.$require('events');
    var imagesApi = biigle.$require('api.images');
    var annotationsApi = biigle.$require('api.annotations');

    return new Vue({
        data: {
            cache: {},
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
            shapeMap: function () {
                return biigle.$require('annotations.shapes');
            },
            inverseShapeMap: function () {
                var map = {};
                for (var id in this.shapeMap) {
                    map[this.shapeMap[id]] = parseInt(id, 10);
                }

                return map;
            },
        },
        methods: {
            parseResponse: function (response) {
                return response.data;
            },
            resolveShape: function (annotation) {
                annotation.shape = this.shapeMap[annotation.shape_id];

                return annotation;
            },
            resolveAllShapes: function (annotations) {
                annotations.forEach(this.resolveShape, this);

                return annotations;
            },
            setDeselected: function (annotation) {
                annotation.selected = false;

                return annotation;
            },
            setAllDeselected: function (annotations) {
                annotations.forEach(this.setDeselected);

                return annotations;
            },
            fetchAnnotations: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = imagesApi.getAnnotations({id: id})
                        .catch(function () {
                            return Vue.Promise.reject('Failed to load annotations for image ' + id + '!');
                        })
                        .then(this.parseResponse)
                        .then(this.resolveAllShapes);
                }

                return this.cache[id].then(this.setAllDeselected);
            },
            create: function (imageId, annotation) {
                annotation.shape_id = this.inverseShapeMap[annotation.shape];
                delete annotation.shape;

                var self = this;
                return imagesApi.saveAnnotations({id: imageId}, annotation)
                    .then(this.parseResponse)
                    .then(this.resolveShape)
                    .then(this.setDeselected)
                    .then(function (annotation) {
                        self.cache[imageId].then(function (annotations) {
                            annotations.unshift(annotation);
                        });

                        return annotation;
                    });
            },
            update: function (annotation) {
                var self = this;
                var promise = annotationsApi.update({id: annotation.id}, {
                    points: annotation.points,
                });

                promise.then(function () {
                    self.cache[annotation.image_id].then(function (annotations) {
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].id === annotation.id) {
                                annotations[i].points = annotation.points;
                                return;
                            }
                        }
                    });
                });

                return promise;
            },
            attachLabel: function (annotation, label) {
                var promise = annotationsApi.attachLabel({id: annotation.id}, label);
                promise.then(function (response) {
                    annotation.labels.unshift(response.data);
                });

                return promise;
            },
            detachLabel: function (annotation, label) {
                var promise = annotationsApi.detachLabel({annotation_label_id: label.id});
                promise.then(function () {
                    for (var i = annotation.labels.length - 1; i >= 0; i--) {
                        if (annotation.labels[i].id === label.id) {
                            annotation.labels.splice(i, 1);
                            return;
                        }
                    }
                });

                return promise;
            },
            delete: function (annotation) {
                var promise = annotationsApi.delete({id: annotation.id});
                var annotationsPromise = this.cache[annotation.image_id];
                promise.then(function () {
                    annotationsPromise.then(function (annotations) {
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].id === annotation.id) {
                                annotations.splice(i, 1);
                                return;
                            }
                        }
                    });
                });

                return promise;
            },
        },
    });
});

/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('events');
    var canvas = document.createElement('canvas');

    var fxCanvas;

    try {
        // If fxCanvas is not initialized WebGL is not supported at all.
        fxCanvas = fx.canvas();
        var fxTexture = null;
        var loadedImageTexture = null;
    } catch (error) {
        console.log('WebGL not supported. Color adjustment disabled.');
    }

    window.addEventListener('beforeunload', function (e) {
        // Make sure the texture is destroyed when the page is left.
        // The browser may take its time to garbage collect it and it may cause
        // crashes due to lack of memory if not explicitly destroyed like this.
        if (fxTexture) {
            fxTexture.destroy();
            // tell the browser that we *really* no longer want to use the resources
            // see: http://stackoverflow.com/a/23606581/1796523
            fxCanvas.width = 1;
            fxCanvas.height = 1;
        }
    });

    return new Vue({
        data: {
            cache: {},
            cachedIds: [],
            maxCacheSize: 10,
            supportsColorAdjustment: false,
            currentlyDrawnImage: null,
            colorAdjustment: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
            },
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
            tilesUri: function () {
                return biigle.$require('annotations.tilesUri');
            },
            supportedTextureSize: function () {
                if (fxCanvas) {
                    return fxCanvas._.gl.getParameter(fxCanvas._.gl.MAX_TEXTURE_SIZE);
                }

                return 0;
            },
            isRemoteVolume: function () {
                return biigle.$require('annotations.volumeIsRemote');
            },
            hasColorAdjustment: function () {
                for (var type in this.colorAdjustment) {
                    if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                        return true;
                    }
                }

                return false;
            },
        },
        methods: {
            isTiledImage: function (image) {
                return image.tiled === true;
            },
            isAdjustmentActive: function (type) {
                return this.colorAdjustment[type].reduce(function (acc, value) {
                    return acc + value;
                }) !== 0;
            },
            checkSupportsColorAdjustment: function (image) {
                if (!fxCanvas || this.isRemoteVolume) {
                    return false;
                }

                if (this.isTiledImage(image)) {
                    this.supportsColorAdjustment = false;
                    return;
                }

                // If we already have a drawn image we only need to check the support
                // again if the image dimensions changed.
                if (this.currentlyDrawnImage && this.currentlyDrawnImage.width === image.width && this.currentlyDrawnImage.height === image.height) {
                    return this.supportsColorAdjustment;
                }

                // Check supported texture size.
                var size = this.supportedTextureSize;
                if (size < image.width || size < image.height) {
                    console.log('Insufficient WebGL texture size. Required: ' + image.width + 'x' + image.height + ', available: ' + size + 'x' + size + '. Color adjustment disabled.');
                    this.supportsColorAdjustment = false;
                    return;
                }

                // Check supported drawing buffer size.
                // see: https://github.com/BiodataMiningGroup/biigle-annotations/issues/44
                fxCanvas.width = image.width;
                fxCanvas.height = image.height;
                if (image.width !== fxCanvas._.gl.drawingBufferWidth || image.height !== fxCanvas._.gl.drawingBufferHeight) {
                    console.log('Your browser does not allow a WebGL drawing buffer with the size of the original image. Color adjustment disabled.');
                    this.supportsColorAdjustment = false;
                    return;
                }

                this.supportsColorAdjustment = true;
            },
            createImage: function (id) {
                var self = this;
                var img = document.createElement('img');
                // We want to use the same canvas element for drawing and to
                // apply the color adjustments for better performance. But we
                // also want Vue to detect switched images which would not work
                // if we simply passed on the canvas element as a prop to a
                // component. We therefore create this new object for each image.
                // And pass it as a prop instead.
                var promise = new Vue.Promise(function (resolve, reject) {
                    img.onload = function () {
                        resolve({
                            source: img,
                            width: img.width,
                            height: img.height,
                            canvas: canvas,
                        });
                    };

                    img.onerror = function () {
                        reject('Failed to load image ' + id + '!');
                    };
                });

                if (this.isRemoteVolume) {
                    // Images of remote volumes *must* be loaded as src of an image
                    // element because of cross origin restrictions!
                    img.src = this.imageFileUri.replace('{id}', id);

                    return promise;

                } else {
                    // If the volume is not remote the image may be tiled. So we request
                    // the data from the endpoint and check if it's an image or a JSON.
                    return Vue.http.get(this.imageFileUri.replace('{id}', id))
                        .catch(function () {
                            return Vue.Promise.reject('Failed to load image ' + id + '!');
                        })
                        .then(function (response) {
                            if (response.bodyBlob.type === 'application/json') {
                                response.body.url = self.tilesUri.replace('{uuid}', response.body.uuid);

                                return response.body;
                            }

                            var urlCreator = window.URL || window.webkitURL;
                            img.src = urlCreator.createObjectURL(response.bodyBlob);

                            return promise;
                        });
                }
            },
            drawSimpleImage: function (image) {
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(image.source, 0, 0);

                return image;
            },
            drawColorAdjustedImage: function (image) {
                if (loadedImageTexture !== image.source.src) {
                    if (fxTexture) {
                        fxTexture.loadContentsOf(image.source);
                    } else {
                        fxTexture = fxCanvas.texture(image.source);
                    }
                    loadedImageTexture = image.source.src;
                }

                fxCanvas.draw(fxTexture);

                for (var type in this.colorAdjustment) {
                    if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                        fxCanvas[type].apply(fxCanvas, this.colorAdjustment[type]);
                    }
                }

                fxCanvas.update();
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(fxCanvas, 0, 0);

                return image;
            },
            drawImage: function (image) {
                this.checkSupportsColorAdjustment(image);
                this.currentlyDrawnImage = image;

                if (this.supportsColorAdjustment && this.hasColorAdjustment) {
                    return this.drawColorAdjustedImage(image);
                } else if (this.isTiledImage(image)) {
                    return image;
                }

                return this.drawSimpleImage(image);
            },
            fetchImage: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    events.$emit('images.fetching', id);
                    this.cache[id] = this.createImage(id);
                    this.cachedIds.push(id);

                }

                return this.cache[id];
            },
            fetchAndDrawImage: function (id) {
                return this.fetchImage(id).then(this.drawImage);
            },
            updateColorAdjustment: function (params) {
                if (!this.supportsColorAdjustment) {
                    return;
                }

                var type, i;
                var colorAdjustment = this.colorAdjustment;
                // Store this *before* the params are applied.
                var hadColorAdjustment = this.hasColorAdjustment;

                for (type in params) {
                    if (params.hasOwnProperty(type)) {
                        for (i = params[type].length - 1; i >= 0; i--) {
                            colorAdjustment[type].splice(i, 1, params[type][i]);
                        }
                    }
                }

                if (this.hasColorAdjustment) {
                    this.drawColorAdjustedImage(this.currentlyDrawnImage);
                } else if (hadColorAdjustment) {
                    // This is the case where a previously active color adjustment was
                    // reset and the original image should be rendered again.
                    this.drawSimpleImage(this.currentlyDrawnImage);
                }
            },
        },
        watch: {
            cachedIds: function (cachedIds) {
                // If there are too many cached images, remove the oldest one to free
                // resources.
                if (cachedIds.length > this.maxCacheSize) {
                    var id = cachedIds.shift();
                    var image = this.cache[id];
                    delete this.cache[id];
                }
            },
        },
    });
});

/**
 * Store for the OpenLayers map
 */
biigle.$declare('annotations.stores.map', function () {
    var map = new ol.Map({
        renderer: 'canvas',
        controls: [
            new ol.control.Zoom(),
            new ol.control.ZoomToExtent({
                tipLabel: 'Zoom to show whole image',
                // bootstrap glyphicons resize-small icon
                label: '\ue097'
            }),
        ],
        interactions: ol.interaction.defaults({
            altShiftDragRotate: false,
            doubleClickZoom: false,
            keyboard: false,
            shiftDragZoom: false,
            pinchRotate: false,
            pinchZoom: false
        }),
    });

    var ZoomToNativeControl = biigle.$require('annotations.ol.ZoomToNativeControl');
    map.addControl(new ZoomToNativeControl({
        // bootstrap glyphicons resize-full icon
        label: '\ue096'
    }));

    return map;
});

/**
 * Store for annotator settings
 */
biigle.$declare('annotations.stores.settings', new Vue({
    data: function () {
        return {
            settings: {},
            storageKey: 'biigle.annotations.settings',
        };
    },
    computed: {
        debounce: function () {
            return biigle.$require('annotations.stores.utils').debounce;
        },
    },
    methods: {
        set: function (key, value) {
            if (this.settings.hasOwnProperty(key)) {
                this.settings[key] = value;
            } else {
                Vue.set(this.settings, key, value);
            }
        },
        delete: function (key) {
            Vue.delete(this.settings, key);
        },
        get: function (key) {
            return this.settings[key];
        },
        has: function (key) {
            return this.settings.hasOwnProperty(key);
        },
        storeSettings: function () {
            var hasItems = false;
            for (var key in this.settings) {
                if (this.settings.hasOwnProperty(key)) {
                    window.localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                    return;
                }
            }

            window.localStorage.removeItem(this.storageKey);
        },
    },
    created: function () {
        var settings = JSON.parse(window.localStorage.getItem(this.storageKey));
        if (settings) {
            Vue.set(this, 'settings', settings);
        }
    },
    watch: {
        settings: {
            handler: function () {
                this.debounce(this.storeSettings, 100, 'annotations.settings');
            },
            deep: true,
        },
    },
}));

/**
 * Store for the styles of OpenLayers features (annotations)
 */
biigle.$declare('annotations.stores.styles', function () {
    var colors = {
        white: [255, 255, 255, 1],
        blue: [0, 153, 255, 1],
        orange: '#ff5e00',
    };

    var defaultCircleRadius = 6;
    var defaultStrokeWidth = 3;

    var defaultStrokeOutline = new ol.style.Stroke({
        color: colors.white,
        width: 5
    });

    var selectedStrokeOutline = new ol.style.Stroke({
        color: colors.white,
        width: 6
    });

    var defaultStroke = new ol.style.Stroke({
        color: colors.blue,
        width: defaultStrokeWidth
    });

    var selectedStroke = new ol.style.Stroke({
        color: colors.orange,
        width: defaultStrokeWidth
    });

    var defaultCircleFill = new ol.style.Fill({
        color: colors.blue
    });

    var selectedCircleFill = new ol.style.Fill({
        color: colors.orange
    });

    var defaultCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: 2
    });

    var selectedCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: defaultStrokeWidth
    });

    var editingCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: 2,
        lineDash: [3]
    });

    var editingStroke = new ol.style.Stroke({
        color: colors.blue,
        width: defaultStrokeWidth,
        lineDash: [5]
    });

    var defaultFill = new ol.style.Fill({
        color: colors.blue
    });

    var selectedFill = new ol.style.Fill({
        color: colors.orange
    });

    return {
        colors: colors,
        features: function (feature) {
            var color = feature.get('color');
            color = color ? ('#' + color) : colors.blue;
            return [
                new ol.style.Style({
                    stroke: defaultStrokeOutline,
                    image: new ol.style.Circle({
                        radius: defaultCircleRadius,
                        fill: new ol.style.Fill({
                            color: color
                        }),
                        stroke: defaultCircleStroke
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: 3
                    })
                }),
            ];
        },
        highlight: [
            new ol.style.Style({
                stroke: selectedStrokeOutline,
                image: new ol.style.Circle({
                    radius: defaultCircleRadius,
                    fill: selectedCircleFill,
                    stroke: selectedCircleStroke
                }),
                zIndex: 200
            }),
            new ol.style.Style({
                stroke: selectedStroke,
                zIndex: 200
            }),
        ],
        editing: [
            new ol.style.Style({
                stroke: defaultStrokeOutline,
                image: new ol.style.Circle({
                    radius: defaultCircleRadius,
                    fill: defaultCircleFill,
                    stroke: editingCircleStroke
                })
            }),
            new ol.style.Style({
                stroke: editingStroke
            }),
        ],
        viewport: [
            new ol.style.Style({
                stroke: defaultStroke,
            }),
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: colors.white,
                    width: 1
                })
            })
        ],
        cross: [
            new ol.style.Style({
                image: new ol.style.RegularShape({
                    stroke: selectedStrokeOutline,
                    points: 4,
                    radius1: 6,
                    radius2: 0,
                    angle: Math.PI / 4
                })
            }),
            new ol.style.Style({
                image: new ol.style.RegularShape({
                    stroke: selectedStroke,
                    points: 4,
                    radius1: 6,
                    radius2: 0,
                    angle: Math.PI / 4
                })
            }),
        ]
    };
});

/**
 * Store for utility functions
 */
biigle.$declare('annotations.stores.utils', function () {
    var debounceTimeouts = {};
    var throttleTimeouts = {};
    var throttleFunctions = {};
    return {
        // Waits until the debounce wasn't called for 'wait' ms with the id until the
        // callback is executed. If it is contiuously called, the callback is not
        // executed.
        debounce: function (callback, wait, id) {
            if (debounceTimeouts.hasOwnProperty(id)) {
                window.clearTimeout(debounceTimeouts[id]);
            }
            debounceTimeouts[id] = window.setTimeout(callback, wait);
        },
        // Executes the most recent callback every 'wait' ms as long as throttle is
        // called.
        throttle: function (callback, wait, id) {
            throttleFunctions[id] = callback;
            if (!throttleTimeouts.hasOwnProperty(id)) {
                throttleTimeouts[id] = window.setTimeout(function () {
                    throttleFunctions[id]();
                    delete throttleTimeouts[id];
                }, wait);
            }
        },
    };
});
