<script>
import DismissImageGrid from '../components/dismissImageGrid.vue';
import Echo from '@/core/echo.js';
import Events from '@/core/events.js';
import FilteringTab from '../components/filteringTab.vue';
import LabelList from '../components/labelList.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.js';
import PowerToggle from '@/core/components/powerToggle.vue';
import RelabelImageGrid from '../components/relabelImageGrid.vue';
import SettingsTab from '../components/settingsTab.vue';
import Sidebar from '@/core/components/sidebar.vue';
import SidebarTab from '@/core/components/sidebarTab.vue';
import SortingTab from '../components/sortingTab.vue';
import {handleErrorResponse} from '@/core/messages/store.js';
import {IMAGE_ANNOTATION, VIDEO_ANNOTATION} from '../constants.js';
import {SORT_DIRECTION, SORT_KEY} from '../components/sortingTab.vue';

/**
 * Mixin for largo view models
 */
export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        sidebar: Sidebar,
        sidebarTab: SidebarTab,
        powerToggle: PowerToggle,
        dismissImageGrid: DismissImageGrid,
        relabelImageGrid: RelabelImageGrid,
        settingsTab: SettingsTab,
        sortingTab: SortingTab,
        filteringTab: FilteringTab,
        labelList: LabelList,
    },
    data() {
        return {
            user: null,
            labelTrees: [],
            step: 0,
            selectedLabel: null,
            annotationsCache: {},
            lastSelectedImage: null,
            forceChange: false,
            waitForSessionId: null,
            showAnnotationOutlines: true,
            // The cache is nested in two levels. The first level key is the label ID.
            // The second level key is the sorting key. The cached value is an array
            // of annotation IDs sorted in ascending order.
            sortingSequenceCache: {},
            sortingSequence: [],
            sortingDirection: SORT_DIRECTION.DESCENDING,
            sortingKey: SORT_KEY.ANNOTATION_ID,
            needsSimilarityReference: false,
            similarityReference: null,
            pinnedImage: null,
            activeFilters: [],
            union: false,
            labels: [],
            filtersCache: {},
            fetchedLabelCount: false,
        };
    },
    provide() {
        const appData = {}

        // Need defineProperty to maintain reactivity.
        // See https://stackoverflow.com/questions/65718651/how-do-i-make-vue-2-provide-inject-api-reactive
        Object.defineProperty(appData, "showAnnotationOutlines", {
            get: () => this.showAnnotationOutlines,
        })

        return { 'outlines': appData };
    },
    computed: {
        isInDismissStep() {
            return this.step === 0;
        },
        isInRelabelStep() {
            return this.step === 1;
        },
        annotations() {
            if (!this.selectedLabel || this.loading) {
                return [];
            }

            if (this.annotationsCache.hasOwnProperty(this.selectedLabel.id)) {
                let annotations = this.annotationsCache[this.selectedLabel.id];
                let filtersCacheKey = JSON.stringify({
                    ...this.activeFilters,
                    label: this.selectedLabel.id,
                    union: this.union
                });
                if (this.hasActiveFilters) {
                    if (!this.filtersCache.hasOwnProperty(filtersCacheKey)) {
                        return [];
                    }
                    annotations = annotations.filter(
                        annotation => this.filtersCache[filtersCacheKey].get(annotation.id)
                    );
                }

                return annotations;
            }

            return [];
        },
        annotationsCount() {
            return this.annotations.length;
        },
        sortedAnnotations() {
            let annotations = this.annotations;

            if (annotations.length === 0) {
                return annotations;
            }

            if (this.sortingKey !== SORT_KEY.ANNOTATION_ID) {
                const map = {};
                annotations.forEach((a) => {
                    // Image annotation IDs are prefixed with 'i', video annotations with
                    // 'v' to avoid duplicate IDs whe sorting both types of annotations.
                    map[a.type === VIDEO_ANNOTATION ? ('v' + a.id) : ('i' + a.id)] = a;
                });
                annotations = this.sortingSequence
                   .map(id => map[id])
                   .filter(id => id !== undefined);
            }

            if (this.sortingDirection === SORT_DIRECTION.ASCENDING) {
                return annotations.slice().reverse();
            }

            return annotations;
        },
        allAnnotations() {
            let annotations = [];

            for (let id in this.annotationsCache) {
                if (!this.annotationsCache.hasOwnProperty(id)) continue;
                // This MUST use concat() because for lots of annotations, solutions
                // like a.push(...b) no longer work (exceeding maximum call stack size).
                annotations = annotations.concat(this.annotationsCache[id]);
            }

            return annotations;
        },
        hasNoAnnotations() {
            return this.selectedLabel && !this.loading && this.annotations.length === 0;
        },
        dismissedAnnotations() {
            return this.allAnnotations.filter(item => item.dismissed);
        },
        dismissedAnnotationsCount() {
            return this.dismissedAnnotations.length;
        },
        annotationsWithNewLabel() {
            return this.dismissedAnnotations.filter(item => !!item.newLabel);
        },
        hasDismissedAnnotations() {
            return this.dismissedAnnotations.length > 0;
        },
        dismissedImageAnnotationsToSave() {
            return this.packDismissedToSave(
                this.dismissedAnnotations.filter(a => a.type === IMAGE_ANNOTATION)
            );
        },
        dismissedVideoAnnotationsToSave() {
            return this.packDismissedToSave(
                this.dismissedAnnotations.filter(a => a.type === VIDEO_ANNOTATION)
            );
        },
        changedImageAnnotationsToSave() {
            return this.packChangedToSave(
                this.annotationsWithNewLabel.filter(a => a.type === IMAGE_ANNOTATION)
            );
        },
        changedVideoAnnotationsToSave() {
            return this.packChangedToSave(
                this.annotationsWithNewLabel.filter(a => a.type === VIDEO_ANNOTATION)
            );
        },
        toDeleteCount() {
            return this.dismissedAnnotations.length - this.annotationsWithNewLabel.length;
        },
        saveButtonClass() {
            return this.forceChange ? 'btn-danger' : 'btn-success';
        },
        sortingIsActive() {
            return this.isInDismissStep && (this.sortingKey !== SORT_KEY.ANNOTATION_ID || this.sortingDirection !== SORT_DIRECTION.DESCENDING);
        },
        imagesPinnable() {
            return this.needsSimilarityReference || this.sortingKey === SORT_KEY.SIMILARITY;
        },
        labelTreesIndex() {
            // Map api-labels to labelTree-labels to enable label selection between tabs.
            // Selected labels are highlighted in label tree and label list tabs if the same label object is used.
            // Retrieve label from tree by using labels tree index.
            let index = {};
            this.labelTrees.forEach((t, i) => {
                index[t.id] = { index: i, labels: {} };
                t.labels.forEach((l, j) => {
                    index[t.id].labels[l.id] = j;
                })
            });
            return index;
        },
        pinnedImageInAnnotations() {
            return this.annotations.includes(this.pinnedImage);
        },
        hasActiveFilters() {
            return this.activeFilters.length > 0
        }
    },
    methods: {
        compileFilters(filters, union) {
            let parameters = [];

            filters.forEach(
                (filter) => {
                    if (!parameters[filter.filter]) {
                        parameters[filter.filter] = [];
                    }
                    parameters[filter.filter].push(filter.value);
                }
            )
            parameters['union'] = union ? 1 : 0;
            return parameters;
        },
        getAnnotations(label) {
            let promise1;
            let promise2;
            let filterPromise;

            //store in variables to avoid race conditions
            let union = this.union;
            let activeFilters = this.activeFilters;

            if (!this.annotationsCache.hasOwnProperty(label.id)) {
                this.annotationsCache[label.id] = [];
                this.startLoading();
                promise1 = this.queryAnnotations(label)
                    .then(
                        (response) => this.gotAnnotations(label, response),
                        handleErrorResponse
                    )
                    .then(a => this.annotationsCache[label.id] = a)
            } else {
                promise1 = Promise.resolve();
            }

            if (this.sortingKey === SORT_KEY.SIMILARITY) {
                promise2 = this.resetSorting();
            } else if (this.sortingIsActive) {
                this.sortingSequence = [];
                // Reload sequence for new label.
                promise2 = this.updateSortKey(this.sortingKey);
            } else {
                promise2 = Promise.resolve();
            }

            if (activeFilters.length > 0) {

                let filtersCacheKey = JSON.stringify({...activeFilters, label: label.id, union: union});

                if (!this.filtersCache.hasOwnProperty(filtersCacheKey)) {
                    if (!this.loading) {
                        // Not setting up loading here can cause flickering images.
                        this.startLoading();
                    }
                    filterPromise = this.loadFilters(label, activeFilters, union, filtersCacheKey);
                }
            }

            Promise.all([promise1, promise2, filterPromise]).finally(this.finishLoading);
        },
        gotAnnotations(label, response) {

            let imageAnnotations = response[0].data;
            let videoAnnotations = response[1].data;

            // This is the object that we will use to store information for each
            // annotation patch.
            let annotations = [];

            if (imageAnnotations) {
                annotations = annotations.concat(this.initAnnotations(label, imageAnnotations, IMAGE_ANNOTATION));
            }

            if (videoAnnotations) {
                annotations = annotations.concat(this.initAnnotations(label, videoAnnotations, VIDEO_ANNOTATION));
            }

            // Show the newest annotations (with highest ID) first.
            annotations = annotations.sort((a, b) => b.id - a.id);

            return annotations
        },
        removeFilter(key) {
            this.activeFilters.splice(key, 1);
        },
        handleSelectedFilters() {
            let filters = this.activeFilters;
            let union = this.union;
            let label = this.selectedLabel;

            if (!label) {
                return [];
            }

            let filtersCacheKey = JSON.stringify({...filters, label: label.id, union: union});

            if (!this.filtersCache.hasOwnProperty(filtersCacheKey)) {
                this.startLoading();
                this.loadFilters(label, filters, union, filtersCacheKey)
                    .finally(this.finishLoading);
            }
        },
        loadFilters(label, filters, union, filtersCacheKey) {
            let requestParams = this.compileFilters(filters, union);
            return this.queryAnnotations(label, requestParams)
                .then(
                    (response) => this.gotAnnotations(label, response),
                    handleErrorResponse
                )
                .then(a => a.map(ann => [ann.id, true]))
                .then(a => new Map(a))
                .then(a => this.filtersCache[filtersCacheKey] = a);
        },
        initAnnotations(label, annotations, type) {
            return Object.keys(annotations)
                .map(function (id) {
                    return {
                        id: id,
                        uuid: annotations[id],
                        label_id: label.id,
                        dismissed: false,
                        newLabel: null,
                        type: type,
                    };
                });
        },
        handleSelectedLabel(label) {
            this.selectedLabel = label;

            if (this.isInDismissStep) {
                this.getAnnotations(label);
            }
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
        },
        handleSelectedImageDismiss(image, event) {
            if (image.dismissed) {
                image.dismissed = false;
                image.newLabel = null;
            } else {
                image.dismissed = true;
                if (event.shiftKey && this.lastSelectedImage) {
                    this.dismissAllImagesBetween(image, this.lastSelectedImage);
                } else {
                    this.lastSelectedImage = image;
                }
            }
        },
        goToRelabel() {
            this.step = 1;
            this.lastSelectedImage = null;
            this.resetFilteringTab();
        },
        goToDismiss() {
            this.step = 0;
            this.lastSelectedImage = null;
            if (this.selectedLabel) {
                this.getAnnotations(this.selectedLabel);
            }
        },
        handleSelectedImageRelabel(image, event) {
            if (image.newLabel) {
                // If a new label is selected, swap the label instead of removing it.
                if (this.selectedLabel && image.newLabel.id !== this.selectedLabel.id) {
                    image.newLabel = this.selectedLabel;
                } else {
                    image.newLabel = null;
                }
            } else if (this.selectedLabel) {
                image.newLabel = this.selectedLabel;
                if (event.shiftKey && this.lastSelectedImage) {
                    this.relabelAllImagesBetween(image, this.lastSelectedImage);
                } else {
                    this.lastSelectedImage = image;
                }
            }
        },
        save() {
            if (this.loading) {
                return;
            }

            if (this.toDeleteCount > 0) {
                let response;
                while (response !== null && parseInt(response, 10) !== this.toDeleteCount) {
                    response = prompt(`This might delete ${this.toDeleteCount} annotation(s). Please enter the number to continue.`);
                }

                if (response === null) {
                    return;
                }
            }

            this.startLoading();
            this.performSave({
                    dismissed_image_annotations: this.dismissedImageAnnotationsToSave,
                    changed_image_annotations: this.changedImageAnnotationsToSave,
                    dismissed_video_annotations: this.dismissedVideoAnnotationsToSave,
                    changed_video_annotations: this.changedVideoAnnotationsToSave,
                    force: this.forceChange,
                })
                .then(
                    (response) => {
                        this.waitForSessionId = response.body.id;
                        this.resetLabelCount();
                    },
                    (response) => {
                        this.finishLoading();
                        handleErrorResponse(response);
                    }
                );
        },
        handleSessionSaved(event) {
            if (event.id == this.waitForSessionId) {
                this.finishLoading();
                Messages.success('Saved. You can now start a new re-evaluation session.');
                this.step = 0;
                for (let key in this.annotationsCache) {
                    if (!this.annotationsCache.hasOwnProperty(key)) continue;
                    delete this.annotationsCache[key];
                }
                for (let key in this.sortingSequenceCache) {
                    if (!this.sortingSequenceCache.hasOwnProperty(key)) continue;
                    delete this.sortingSequenceCache[key];
                }
                this.handleSelectedLabel(this.selectedLabel);
            }
        },
        handleSessionFailed(event) {
            if (event.id == this.waitForSessionId) {
                this.finishLoading();
                Messages.danger('There was an unexpected error.');
            }
        },
        dismissAllImagesBetween(image1, image2) {
            let index1 = this.sortedAnnotations.indexOf(image1);
            let index2 = this.sortedAnnotations.indexOf(image2);
            if (index2 < index1) {
                let tmp = index2;
                index2 = index1;
                index1 = tmp;
            }

            for (let i = index1 + 1; i < index2; i++) {
                this.sortedAnnotations[i].dismissed = true;
            }
        },
        relabelAllImagesBetween(image1, image2) {
            let label = this.selectedLabel;
            let index1 = this.allAnnotations.indexOf(image1);
            let index2 = this.allAnnotations.indexOf(image2);
            if (index2 < index1) {
                let tmp = index2;
                index2 = index1;
                index1 = tmp;
            }

            for (let i = index1 + 1; i < index2; i++) {
                if (this.allAnnotations[i].dismissed) {
                    this.allAnnotations[i].newLabel = label;
                }
            }
        },
        enableForceChange() {
            this.forceChange = true;
        },
        disableForceChange() {
            this.forceChange = false;
        },
        packDismissedToSave(annotations) {
            let dismissed = {};

            for (let i = annotations.length - 1; i >= 0; i--) {
                if (dismissed.hasOwnProperty(annotations[i].label_id)) {
                    dismissed[annotations[i].label_id].push(annotations[i].id);
                } else {
                    dismissed[annotations[i].label_id] = [annotations[i].id];
                }
            }

            return dismissed;
        },
        packChangedToSave(annotations) {
            let changed = {};

            for (let i = annotations.length - 1; i >= 0; i--) {
                if (changed.hasOwnProperty(annotations[i].newLabel.id)) {
                    changed[annotations[i].newLabel.id].push(annotations[i].id);
                } else {
                    changed[annotations[i].newLabel.id] = [annotations[i].id];
                }
            }

            return changed;
        },
        initializeEcho() {
            Echo.getInstance().private(`user-${this.user.id}`)
                .listen('.Biigle\\Events\\LargoSessionSaved', this.handleSessionSaved)
                .listen('.Biigle\\Events\\LargoSessionFailed', this.handleSessionFailed);
        },
        updateShowOutlines(show) {
            this.showAnnotationOutlines = show;
        },
        updateSortDirection(direction) {
            this.sortingDirection = direction;
        },
        fetchSortingSequence(key, labelId) {
            const sequence = this.sortingSequenceCache?.[labelId]?.[key];
            if (sequence) {
                return Promise.resolve(sequence);
            }

            let promise;
            if (!this.selectedLabel) {
                promise = Promise.resolve([]);
            } else if (key === SORT_KEY.OUTLIER) {
                promise = this.querySortByOutlier(labelId)
                    .then(response => response.body);
            } else if (key === SORT_KEY.SIMILARITY) {
                // Skip cacheing for this sorting method.
                return this.querySortBySimilarity(labelId, this.similarityReference)
                    .then(response => response.body);
            } else {
                promise = Promise.resolve([]);
            }

            return promise.then(ids => this.putSortingSequenceToCache(key, labelId, ids));
        },
        putSortingSequenceToCache(key, labelId, sequence) {
            if (!this.sortingSequenceCache[labelId]) {
                this.sortingSequenceCache[labelId] = {};
            }

            this.sortingSequenceCache[labelId][key] = sequence;

            return sequence;
        },
        updateSortKey(key) {
            if (key !== SORT_KEY.SIMILARITY) {
                this.similarityReference = null;
                this.pinnedImage = null;
            }

            const labelId = this.selectedLabel?.id;
            this.startLoading();
            return this.fetchSortingSequence(key, labelId)
                .then((sequence) => {
                    this.sortingKey = key;
                    this.sortingSequence = sequence;
                    if (key === SORT_KEY.SIMILARITY) {
                        this.needsSimilarityReference = false;
                        this.pinnedImage = this.similarityReference;
                    }
                })
                .catch((r) => {
                    this.handleErrorResponse(r);
                    this.similarityReference = null;
                })
                .finally(this.finishLoading);
        },
        handleInitSimilaritySort() {
            if (this.sortingKey !== SORT_KEY.SIMILARITY) {
                this.needsSimilarityReference = true;
            }
        },
        handleCancelSimilaritySort() {
            this.needsSimilarityReference = false;
        },
        handlePinImage(image) {
            if (this.pinnedImage?.id === image.id) {
                this.resetSorting();
            } else if (this.imagesPinnable) {
                this.similarityReference = image;
                this.updateSortKey(SORT_KEY.SIMILARITY);
            }
        },
        resetSorting() {
            return this.updateSortKey(SORT_KEY.ANNOTATION_ID)
                .then(() => this.sortingDirection = SORT_DIRECTION.DESCENDING);
        },
        handleOpenTab(tab) {
            if (tab === "label-list" && !this.fetchedLabelCount) {
                this.getLabelCount();
            }
        },
        getLabelCount() {
            this.startLoading();
            this.fetchLabelCount()
                .then(this.parseResponse)
                .catch(handleErrorResponse)
                .finally(this.finishLoading);
        },
        parseResponse(res) {
            this.labels = res.body.reduce((labels, l) => {
                if (this.labelTreesIndex.hasOwnProperty(l.label_tree_id)) {
                    let tIdx = this.labelTreesIndex[l.label_tree_id].index;
                    let lIdx = this.labelTreesIndex[l.label_tree_id].labels[l.id];
                    let label = this.labelTrees[tIdx].labels[lIdx];
                    label.count = l.count;
                    labels.push(label);
                } else {
                    l.selected = false;
                    labels.push(l);
                }
                return labels;
            }, []);
            this.fetchedLabelCount = true;
        },
        resetLabelCount() {
            this.fetchedLabelCount = false;
            this.labels = [];
        },
        resetFilteringTab() {
            this.activeFilters = [];
        },
        addNewFilter(filter) {
            if (this.activeFilters.length > 0) {
                if (
                    this.activeFilters.some(
                        (f) =>
                            f.filter === filter.filter &&
                            f.value === filter.value
                    )
                ) {
                    return;
                }
            }
            this.activeFilters.push(filter);
        },
        setUnionLogic(union) {
            this.union = union;
        }
    },
    watch: {
        annotationsCount(count) {
            Events.emit('annotations-count', count);
        },
        dismissedAnnotationsCount(count) {
            Events.emit('dismissed-annotations-count', count);
        },
        step(step) {
            Events.emit('step', step);
        },
        selectedLabel(_, oldLabel) {
            if (this.isInDismissStep) {
                this.$refs.dismissGrid.setOffset(0);
            }
            // Old label can still be selected if selection was triggered in label list component
            if (oldLabel?.selected) {
                oldLabel.selected = false;
            }
        },
        union() {
            this.handleSelectedFilters();
        },
        activeFilters: {
            deep: true,
            handler() {
                if (this.isInDismissStep) {
                    this.handleSelectedFilters();
                }
            },
        },
    },
    created() {
        this.user = biigle.$require('largo.user');

        window.addEventListener('beforeunload', (e) => {
            if (this.hasDismissedAnnotations) {
                e.preventDefault();
                e.returnValue = '';

                return 'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
            }
        });

        this.initializeEcho();
    },
};
</script>
