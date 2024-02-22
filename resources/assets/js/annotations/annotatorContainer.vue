<script>
import AnnotationCanvas from './components/annotationCanvas';
import AnnotationCanvasMixins from './stores/annotationCanvasMixins';
import AnnotationModesTab from './components/annotationModesTab';
import AnnotationsStore from './stores/annotations';
import AnnotationsTab from './components/siaAnnotationsTab';
import ColorAdjustmentTab from './components/colorAdjustmentTab';
import Events from '../core/events';
import ImageLabelTab from './components/imageLabelTab';
import ImagesStore from './stores/images';
import LabelFilter from './models/LabelAnnotationFilter';
import LabelsTab from './components/labelsTab';
import Loader from '../core/mixins/loader';
import Messages from '../core/messages/store';
import SessionFilter from './models/SessionAnnotationFilter';
import Settings from './stores/settings';
import SettingsTab from './components/settingsTab';
import ShapeFilter from './models/ShapeAnnotationFilter';
import Sidebar from '../core/components/sidebar';
import SidebarTab from '../core/components/sidebarTab';
import UserFilter from './models/UserAnnotationFilter';
import VolumeImageAreaApi from './api/volumes';
import {CrossOriginError} from './stores/images';
import {debounce} from './../core/utils';
import {handleErrorResponse} from '../core/messages/store';
import {urlParams as UrlParams} from '../core/utils';

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
        annotationCanvas: function (resolve) {
            // This enables the addition of mixins to the annotation canvas from modules
            // at runtime (e.g. by biigle/magic-sam).
            AnnotationCanvasMixins.forEach(function (mixin) {
                if (!AnnotationCanvas.mixins.includes(mixin)) {
                    AnnotationCanvas.mixins.push(mixin);
                }
            });
            resolve(AnnotationCanvas);
        },
    },
    data() {
        return {
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
            cachedImagesCount: 1,
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
            userId: null,
            crossOriginError: false,
        };
    },
    computed: {
        canAdd() {
            return this.isEditor && (this.image !== null);
        },
        canModify() {
            return this.canAdd;
        },
        canDelete() {
            return this.canAdd;
        },
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
            // produced by the volume overview page when the files are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotation tool.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.files`);
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
        hasCrossOriginError() {
            return !this.loading && this.crossOriginError;
        },
        annotationsHiddenByFilter() {
            return this.annotations.length !== this.filteredAnnotations.length;
        },
        annotationCount() {
            return this.annotations.length;
        }
    },
    methods: {
        getImageAndAnnotationsPromises(id) {
            return [
                ImagesStore.fetchAndDrawImage(id),
                AnnotationsStore.fetchAnnotations(id),
            ];
        },
        updateUrlSlug() {
            UrlParams.setSlug(this.imageId, -2);
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
                } else if (this.focussedAnnotationIndex === Infinity) {
                    // This may happen if the volume has only one image and we can't
                    // switch to the next image. Here, we want to go to the second
                    // annotation of the image.
                    this.focussedAnnotationIndex = Math.min(1, this.filteredAnnotations.length - 1);
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
                } else if (this.focussedAnnotationIndex === -Infinity) {
                    // This may happen if the volume has only one image and we can't
                    // switch to the next image. Here, we want to go to the second to
                    // last annotation of the image.
                    this.focussedAnnotationIndex = Math.max(this.filteredAnnotations.length - 2, 0);
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
                        .then(() => this.refreshSingleAnnotation(annotation))
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
                let promise = AnnotationsStore.attachLabel(annotation, annotationLabel);
                promise.catch(handleErrorResponse);

                return promise;
            }

            return Vue.Promise.reject();
        },
        handleSwapLabel(annotation, label) {
            label = label || this.selectedLabel;
            if (this.isEditor && label) {
                let lastLabel = annotation.labels
                    .filter(l => l.user_id === this.userId)
                    .sort((a, b) => a.id - b.id)
                    .pop();

                this.handleAttachLabel(annotation, label)
                    .then(() => {
                        if (lastLabel) {
                            this.handleDetachAnnotationLabel(annotation, lastLabel);
                        }
                    })
                    .catch(handleErrorResponse);
            }
        },
        refreshSingleAnnotation(annotation){
            this.$refs.canvas.refreshSingleAnnotation(annotation);
        },
        handleAttachAllSelected() {
            this.selectedAnnotations.forEach(this.handleAttachLabel);
        },
        emitImageChanged() {
            Events.$emit('images.change', this.imageId, this.image);
        },
        cachePreviousAndNext() {
            let toCache = [];
            // Include the current ID so the image is not requested multiple times (e.g.
            // if there is only one image). Selected annotations would be deselected if
            // the current image would be loaded again.
            let cachedIds = [this.imageId];
            let cachedImagesCount = Math.min(this.cachedImagesCount, this.imagesIds.length);

            for (let x = 0; x < cachedImagesCount; x++) {
                const nextId = this.imagesIds[this.getNextIndex(this.imageIndex + x)];
                if (!cachedIds.includes(nextId)) {
                    toCache.push(AnnotationsStore.fetchAnnotations(nextId));
                    toCache.push(ImagesStore.fetchImage(nextId));
                    cachedIds.push(nextId);
                }

                const previousId = this.imagesIds[this.getPreviousIndex(this.imageIndex - x)];
                if (!cachedIds.includes(previousId)) {
                    toCache.push(AnnotationsStore.fetchAnnotations(previousId));
                    toCache.push(ImagesStore.fetchImage(previousId));
                    cachedIds.push(previousId);
                }
            }

            // Ignore errors in this case. The application will try to reload
            // the data again if the user switches to the respective image
            // and display the error message then.
            Vue.Promise.all(toCache).catch(function () {});
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
                case 'cachedImagesCount':
                    this.cachedImagesCount = value;
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
        handleClosedTab() {
            Settings.delete('openTab');
        },
        createSampledAnnotation() {
            this.$refs.canvas.createSampledAnnotation();
        },
        fetchImagesArea() {
            if (!this.imagesArea) {
                this.imagesArea = {};
                VolumeImageAreaApi.get({id: this.volumeId})
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
        dismissCrossOriginError() {
            this.crossOriginError = false;
        },
        handleInvalidShape(shape) {
            let count;
            switch(shape){
                case 'Circle':
                    Messages.danger('Invalid shape. Circle needs non-zero radius');
                    return;
                case 'LineString':
                    shape = 'Line'
                    count = 2;
                    break;
                case 'Polygon':
                    count = 'at least 3';
                    break;
                case 'Rectangle':
                case 'Ellipse':
                    count = 4;
                    break;
                default:
                    return;
            }
            Messages.danger(`Invalid shape. ${shape} needs ${count} different points.`);
        },
    },
    watch: {
        async imageId(id) {
            if (!id) {
                return;
            }

            this.startLoading();
            this.crossOriginError = false;

            try {
                let [image, annotations] = await Vue.Promise.all(this.getImageAndAnnotationsPromises(id));
                this.image = image;
                this.annotations = annotations;
                this.maybeUpdateAnnotationMode();
                this.maybeShowTilingInProgressMessage();
            } catch (e) {
                if (e instanceof CrossOriginError) {
                    this.crossOriginError = true;
                } else {
                    this.image = null;
                    this.annotations = [];
                    Messages.danger(e);
                }
            } finally {
                this.updateUrlSlug();
                this.emitImageChanged();
                // When everything is loaded, pre-fetch the data of the next and
                // previous images so they can be switched fast.
                this.cachePreviousAndNext();
                this.finishLoading();
            }
        },
        cachedImagesCount(count) {
            debounce(this.cachePreviousAndNext, 1000, 'annotations.cached-image-count.update');
            // Twice the count because the next and previous images are cached.
            ImagesStore.setMaxCacheSize(count * 2);
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
        mapResolution() {
            if (this.isVolareAnnotationMode) {
                this.userUpdatedVolareResolution = true;
            }
        },
        annotations(annotations) {
            this.annotationFilters[0].annotations = annotations;
            this.annotationFilters[1].annotations = annotations;
        },
        image(image) {
            this.crossOriginError = image?.crossOrigin;
        },
    },
    created() {
        this.allImagesIds = biigle.$require('annotations.imagesIds');
        this.volumeId = biigle.$require('annotations.volumeId');
        this.isEditor = biigle.$require('annotations.isEditor');
        this.userId = biigle.$require('annotations.userId');
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
                        // Use $nextTick so the annotationCanvas component has time to
                        // render the image.
                        this.$nextTick(
                            () => this.selectAndFocusAnnotation(annotations[i])
                        );
                        return;
                    }
                }
            });
        }

        if (Settings.has('openTab')) {
            let openTab = Settings.get('openTab');
            if (openTab === 'color-adjustment') {
                Events.$once('images.change', () => {
                    if (this.supportsColorAdjustment) {
                        this.openTab = openTab;
                    }
                });
            } else {
                this.openTab = openTab;
            }
        }
    },
    mounted() {
        Events.$emit('annotations.map.init', this.$refs.canvas.map);
    },
};
</script>
