import AnnotationsStore from './stores/annotations';
import AnnotationsTab from './components/siaAnnotationsTab';
import ImagesStore from './stores/images';
import LabelFilter from './models/LabelAnnotationFilter';
import SessionFilter from './models/SessionAnnotationFilter';
import Settings from './stores/settings';
import ShapeFilter from './models/ShapeAnnotationFilter';
import UserFilter from './models/UserAnnotationFilter';
import {debounce} from './import';
import {Events} from './import';
import {handleErrorResponse} from './import';
import {Loader} from './import';
import {Messages} from './import';
import {SidebarTab} from './import';
import {Sidebar} from './import';
import {UrlParams} from './import';
import LabelsTab from './components/labelsTab';
import AnnotationModesTab from './components/annotationModesTab';
import ColorAdjustmentTab from './components/colorAdjustmentTab';
import ImageLabelTab from './components/imageLabelTab';
import SettingsTab from './components/settingsTab';
import AnnotationCanvas from './components/annotationCanvas';

/**
 * View model for the annotator container
 */

export default {
    mixins: [Loader],
    components: {
        sidebar: Sidebar,
        sidebarTab: SidebarTab,
        annotationsTab: AnnotationsTab,
        labelsTab: LabelsTab,
        annotationModesTab: AnnotationModesTab,
        colorAdjustmentTab: ColorAdjustmentTab,
        imageLabelTab: ImageLabelTab,
        settingsTab: SettingsTab,
        annotationCanvas: AnnotationCanvas,
    },
    data: {
        allImagesIds: [],
        volumeId: null,
        isEditor: false,
        imageIndex: null,
        image: null,
        annotations: [],
        annotationFilter: null,
        annotationFilters: [],
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
        imageId() {
            return this.imagesIds[this.imageIndex];
        },
        hasAnnotationFilter() {
            return this.annotationFilter !== null;
        },
        filteredAnnotations() {
            let annotations = this.annotations.filter((a) => !a.markedForDeletion);

            if (this.annotationFilter) {
                return this.annotationFilter.filter(annotations);
            }

            return annotations;
        },
        selectedAnnotations() {
            return this.filteredAnnotations.filter((a) => a.selected);
        },
        supportsColorAdjustment() {
            return ImagesStore.supportsColorAdjustment;
        },
        focussedAnnotation() {
            return this.filteredAnnotations[this.focussedAnnotationIndex];
        },
        isDefaultAnnotationMode() {
            return this.annotationMode === 'default';
        },
        isVolareAnnotationMode() {
            return this.annotationMode === 'volare';
        },
        isLawnmowerAnnotationMode() {
            return this.annotationMode === 'lawnmower';
        },
        isSamplingAnnotationMode() {
            return this.annotationMode.endsWith('Sampling');
        },
        imagesIds() {
            let imagesIds = this.allImagesIds.slice();
            // Look for a sequence of image IDs in local storage. This sequence is
            // produced by the volume overview page when the images are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotator.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.images`);
            if (storedSequence) {
                // If there is such a stored sequence, filter out any image IDs that
                // do not belong to the volume (any more), since some of them may
                // have been deleted in the meantime.
                let map = {};
                imagesIds.forEach(function (id) {
                    map[id] = null;
                });
                return JSON.parse(storedSequence).filter((id) => map.hasOwnProperty(id));
            }

            return imagesIds;
        },
    },
    methods: {
        getImageAndAnnotationsPromises(id) {
            return [
                ImagesStore.fetchAndDrawImage(id),
                AnnotationsStore.fetchAnnotations(id),
            ];
        },
        setCurrentImageAndAnnotations(args) {
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
        updateUrlSlug() {
            UrlParams.setSlug(this.imageId);
        },
        getNextIndex(index) {
            return (index + 1) % this.imagesIds.length;
        },
        getPreviousIndex(index) {
            return (index + this.imagesIds.length - 1) % this.imagesIds.length;
        },
        handleNext() {
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
        handlePrevious() {
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
        maybeUpdateFocussedAnnotation() {
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
        maybeUpdateShownImageSection() {
            if (this.isLawnmowerAnnotationMode) {
                if (this.annotationModeCarry === Infinity) {
                    this.$refs.canvas.showLastImageSection();
                } else {
                    this.$refs.canvas.showFirstImageSection();
                }
            }
        },
        maybeUpdateShownSampling(data) {
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
        maybeUpdateAnnotationMode(data) {
            this.maybeUpdateFocussedAnnotation();
            this.maybeUpdateShownImageSection();
            this.maybeUpdateShownSampling(data);
        },
        handleMapMoveend(viewport) {
            this.mapCenter = viewport.center;
            this.mapResolution = viewport.resolution;
            UrlParams.set({
                r: Math.round(viewport.resolution * 100),
                x: Math.round(viewport.center[0]),
                y: Math.round(viewport.center[1]),
            });
        },
        // Handler for the select event fired by the global event bus.
        handleSelectAnnotation(annotation, shift) {
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
        handleSelectAnnotations(selected, deselected) {
            selected.forEach(function (annotation) {
                annotation.selected = true;
            });

            deselected.forEach(function (annotation) {
                annotation.selected = false;
            });
        },
        handleDeselectAnnotation(annotation) {
            if (annotation) {
                annotation.selected = false;
            } else {
                this.annotations.forEach(function (a) {
                    a.selected = false;
                });
            }
        },
        focusAnnotation(annotation, fast, keepResolution) {
            this.$refs.canvas.focusAnnotation(annotation, fast, keepResolution);
        },
        handleDetachAnnotationLabel(annotation, annotationLabel) {
            if (this.isEditor) {
                if (annotation.labels.length > 1) {
                    AnnotationsStore.detachLabel(annotation, annotationLabel)
                        .catch(handleErrorResponse);
                } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                    this.handleDeleteAnnotation(annotation);
                }
            }
        },
        handleDeleteAnnotation(annotation) {
            if (!this.isEditor) return;

            if (this.lastCreatedAnnotation && this.lastCreatedAnnotation.id === annotation.id) {
                this.lastCreatedAnnotation = null;
            }

            // Mark for deletion so the annotation is immediately removed from
            // the canvas. See https://github.com/biigle/annotations/issues/70
            Vue.set(annotation, 'markedForDeletion', true);
            AnnotationsStore.delete(annotation)
                .catch(function (response) {
                    annotation.markedForDeletion = false;
                    handleErrorResponse(response);
                });
        },
        handleDeleteAnnotations(annotations) {
            annotations.forEach(this.handleDeleteAnnotation);
        },
        handleUpdateAnnotations(annotations) {
            if (this.isEditor) {
                Vue.Promise.all(annotations.map(AnnotationsStore.update))
                    .catch(handleErrorResponse);
            }
        },
        selectAndFocusAnnotation(annotation, keepResolution) {
            this.selectedAnnotations.forEach(function (a) {
                a.selected = false;
            });
            annotation.selected = true;
            this.focusAnnotation(annotation, true, keepResolution);
        },
        handleFilter(filter) {
            this.annotationFilter = filter;
        },
        resetFilter() {
            if (this.annotationFilter) {
                this.annotationFilter.reset();
            }
            this.annotationFilter = null;
        },
        handleSelectedLabel(label) {
            this.selectedLabel = label;
        },
        handleNewAnnotation(annotation, removeCallback) {
            if (this.isEditor) {
                annotation.label_id = this.selectedLabel.id;
                // TODO: confidence control
                annotation.confidence = 1;
                AnnotationsStore.create(this.imageId, annotation)
                    .then(this.setLastCreatedAnnotation)
                    .catch(handleErrorResponse)
                    // Remove the temporary annotation if saving succeeded or failed.
                    .finally(removeCallback);
            }
        },
        handleAttachLabel(annotation, label) {
            label = label || this.selectedLabel;
            if (this.isEditor && label) {
                let annotationLabel = {
                    label_id: label.id,
                    // TODO: confidence control
                    confidence: 1,
                };
                AnnotationsStore.attachLabel(annotation, annotationLabel)
                    .catch(handleErrorResponse);
            }
        },
        handleAttachAllSelected() {
            this.selectedAnnotations.forEach(this.handleAttachLabel);
        },
        emitImageChanged() {
            Events.$emit('images.change', this.imageId, this.image);
        },
        cachePreviousAndNext() {
            let previousId = this.imagesIds[this.getPreviousIndex(this.imageIndex)];
            let nextId = this.imagesIds[this.getNextIndex(this.imageIndex)];
            // If there is only one image, previousId and nextId equal this.imageId.
            // No caching should be requested as this might deselect any selected
            // annotations on the current image.
            if (previousId !== this.imageId) {
                Vue.Promise.all([
                        AnnotationsStore.fetchAnnotations(nextId),
                        ImagesStore.fetchImage(nextId),
                        AnnotationsStore.fetchAnnotations(previousId),
                        ImagesStore.fetchImage(previousId),
                    ])
                    // Ignore errors in this case. The application will try to reload
                    // the data again if the user switches to the respective image
                    // and display the error message then.
                    .catch(function () {});
            }
        },
        setLastCreatedAnnotation(annotation) {
            if (this.lastCreatedAnnotationTimeout) {
                window.clearTimeout(this.lastCreatedAnnotationTimeout);
            }
            this.lastCreatedAnnotation = annotation;
            this.lastCreatedAnnotationTimeout = window.setTimeout(() => {
                this.lastCreatedAnnotation = null;
            }, 10000);
        },
        updateColorAdjustment(params) {
            let canvas = this.$refs.canvas;
            debounce(function () {
                ImagesStore.updateColorAdjustment(params);
                canvas.render();
            }, 100, 'annotations.color-adjustment.update');
        },
        handleSettingsChange(key, value) {
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
        handleAnnotationModeChange(mode, data) {
            this.annotationMode = mode;
            this.annotationModeCarry = null;
            this.maybeUpdateAnnotationMode(data);
        },
        handleOpenedTab(name) {
            Settings.set('openTab', name);
        },
        handleClosedTab(name) {
            Settings.delete('openTab');
        },
        handleLoadingError(message) {
            Messages.danger(message);
        },
        createSampledAnnotation() {
            this.$refs.canvas.createSampledAnnotation();
        },
        fetchImagesArea() {
            if (!this.imagesArea) {
                this.imagesArea = {};
                biigle.$require('annotations.api.volumeImageArea')
                    .get({id: this.volumeId})
                    .then(this.setImagesArea, handleErrorResponse);
            }
        },
        setImagesArea(response) {
            this.imagesArea = response.body;
        },
        handleRequiresSelectedLabel() {
            Messages.info('Please select a label first.');
            this.$refs.sidebar.$emit('open', 'labels');
        },
        maybeShowTilingInProgressMessage: function() {
            if (this.image.tilingInProgress) {
                Messages.warning('This image is currently being processed. Please retry later.');
            }
        },
    },
    watch: {
        imageId(id) {
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
        focussedAnnotation(annotation) {
            if (annotation) {
                this.selectAndFocusAnnotation(annotation, this.userUpdatedVolareResolution);
            }
        },
        annotationFilter() {
            this.maybeUpdateFocussedAnnotation();
        },
        showScaleLine(show) {
            if (show) {
                this.fetchImagesArea();
            }
        },
        showMeasureTooltip(show) {
            if (show) {
                this.fetchImagesArea();
            }
        },
        isVolareAnnotationMode(enabled) {
            if (!enabled) {
                this.userUpdatedVolareResolution = false;
            }
        },
        mapResolution(resolution) {
            if (this.isVolareAnnotationMode) {
                this.userUpdatedVolareResolution = true;
            }
        },
        annotations(annotations) {
            this.annotationFilters[0].annotations = annotations;
            this.annotationFilters[1].annotations = annotations;
        },
    },
    created() {
        this.allImagesIds = biigle.$require('annotations.imagesIds');
        this.volumeId = biigle.$require('annotations.volumeId');
        this.isEditor = biigle.$require('annotations.isEditor');
        this.annotationFilters = [
            new LabelFilter(),
            new UserFilter(),
            new ShapeFilter({
                data: {shapes: biigle.$require('annotations.shapes')}
            }),
            new SessionFilter({
                data: {sessions: biigle.$require('annotations.sessions')}
            }),
        ];

        if (this.imagesIds.length === 0) {
            Messages.info('Your current volume filtering contains no images.');
            return;
        }

        let index = this.imagesIds.indexOf(biigle.$require('annotations.imageId'));
        if (index === -1) {
            index = 0;
            Messages.info('The requested image does not exist in your current volume filtering. Switching to the first image.');
        }
        this.imageIndex = index;

        Events.$emit('images.sequence', this.imagesIds);

        if (UrlParams.get('r') !== undefined) {
            this.mapResolution = parseInt(UrlParams.get('r'), 10) / 100;
        }

        if (UrlParams.get('x') !== undefined && UrlParams.get('y') !== undefined) {
            this.mapCenter = [
                parseInt(UrlParams.get('x'), 10),
                parseInt(UrlParams.get('y'), 10),
            ];
        }

        // These Events are used by the SHERPA client of Michael Kloster and
        // retained for backwards compatibility.
        Events.$on('annotations.select', this.handleSelectAnnotation);
        Events.$on('annotations.deselect', this.handleDeselectAnnotation);
        Events.$on('annotations.detachLabel', this.handleDetachAnnotationLabel);
        Events.$on('annotations.delete', this.handleDeleteAnnotation);
        Events.$on('annotations.focus', this.focusAnnotation);

        if (UrlParams.get('annotation')) {
            let id = parseInt(UrlParams.get('annotation'));
            Events.$once('images.change', () => {
                let annotations = this.annotations;
                for (let i = annotations.length - 1; i >= 0; i--) {
                    if (annotations[i].id === id) {
                        this.selectAndFocusAnnotation(annotations[i]);
                        return;
                    }
                }
            });
        }

        if (Settings.has('openTab')) {
            this.openTab = Settings.get('openTab');
        }

    },
    mounted() {
        Events.$emit('annotations.map.init', this.$refs.canvas.map);
    },
};
