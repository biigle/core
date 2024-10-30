<script>
import DismissImageGrid from "../components/dismissImageGrid";
import RelabelImageGrid from "../components/relabelImageGrid";
import SettingsTab from "../components/settingsTab";
import SortingTab from "../components/sortingTab";
import FilteringTab from "../components/filteringTab";
import { Echo } from "../import";
import { Events } from "../import";
import { handleErrorResponse } from "../import";
import { IMAGE_ANNOTATION, VIDEO_ANNOTATION } from "../constants";
import { LabelTrees } from "../import";
import { LoaderMixin } from "../import";
import { Messages } from "../import";
import { PowerToggle } from "../import";
import { SidebarTab } from "../import";
import { Sidebar } from "../import";
import { SORT_DIRECTION, SORT_KEY } from "../components/sortingTab";

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
      selectedFilters: {},
    };
  },
  provide() {
    const appData = {};

    // Need defineProperty to maintain reactivity.
    // See https://stackoverflow.com/questions/65718651/how-do-i-make-vue-2-provide-inject-api-reactive
    Object.defineProperty(appData, "showAnnotationOutlines", {
      get: () => this.showAnnotationOutlines,
    });

    return { outlines: appData };
  },
  computed: {
    isInDismissStep() {
      return this.step === 0;
    },
    isInRelabelStep() {
      return this.step === 1;
    },
    annotations() {
      if (
        this.selectedLabel &&
        this.annotationsCache.hasOwnProperty(this.getSelectedAnnotationName)
      ) {
        return this.annotationsCache[this.getSelectedAnnotationName];
      }

      return [];
    },
    getSelectedAnnotationName() {
      return JSON.stringify({
        ...this.selectedFilters,
        label: this.selectedLabel.id,
      });
    },
    sortedAnnotations() {
      let annotations = this.annotations;

      if (annotations.length === 0) {
        return annotations;
      }

      // This will be empty for the default sorting.
      if (this.sortingSequence.length > 0) {
        const map = {};
        annotations.forEach((a) => {
          // Image annotation IDs are prefixed with 'i', video annotations with
          // 'v' to avoid duplicate IDs whe sorting both types of annotations.
          map[a.type === VIDEO_ANNOTATION ? "v" + a.id : "i" + a.id] = a;
        });

        annotations = this.sortingSequence.map((id) => map[id]);
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
      return (
        this.selectedLabel && !this.loading && this.annotations.length === 0
      );
    },
    dismissedAnnotations() {
      return this.allAnnotations.filter((item) => item.dismissed);
    },
    annotationsWithNewLabel() {
      return this.dismissedAnnotations.filter((item) => !!item.newLabel);
    },
    hasDismissedAnnotations() {
      return this.dismissedAnnotations.length > 0;
    },
    dismissedImageAnnotationsToSave() {
      return this.packDismissedToSave(
        this.dismissedAnnotations.filter((a) => a.type === IMAGE_ANNOTATION)
      );
    },
    dismissedVideoAnnotationsToSave() {
      return this.packDismissedToSave(
        this.dismissedAnnotations.filter((a) => a.type === VIDEO_ANNOTATION)
      );
    },
    changedImageAnnotationsToSave() {
      return this.packChangedToSave(
        this.annotationsWithNewLabel.filter((a) => a.type === IMAGE_ANNOTATION)
      );
    },
    changedVideoAnnotationsToSave() {
      return this.packChangedToSave(
        this.annotationsWithNewLabel.filter((a) => a.type === VIDEO_ANNOTATION)
      );
    },
    toDeleteCount() {
      return (
        this.dismissedAnnotations.length - this.annotationsWithNewLabel.length
      );
    },
    saveButtonClass() {
      return this.forceChange ? "btn-danger" : "btn-success";
    },
    sortingIsActive() {
      return (
        this.isInDismissStep &&
        (this.sortingKey !== SORT_KEY.ANNOTATION_ID ||
          this.sortingDirection !== SORT_DIRECTION.DESCENDING)
      );
    },
    imagesPinnable() {
      return (
        this.needsSimilarityReference || this.sortingKey === SORT_KEY.SIMILARITY
      );
    },
  },
  methods: {
    getAnnotations(label, filters) {
      let promise1;
      let promise2;

      let label_filter_combination = JSON.stringify({
        ...filters,
        label: label.id,
      });

      if (!this.annotationsCache.hasOwnProperty(label_filter_combination)) {
        Vue.set(this.annotationsCache, label_filter_combination, []);
        this.startLoading();
        promise1 = this.queryAnnotations(label, filters).then(
          (response) => this.gotAnnotations(label, filters, response),
          handleErrorResponse
        );
      } else {
        promise1 = Vue.Promise.resolve();
      }

      if (this.sortingKey === SORT_KEY.SIMILARITY) {
        promise2 = this.resetSorting();
      } else if (this.sortingIsActive) {
        this.sortingSequence = [];
        // Reload sequence for new label.
        promise2 = this.updateSortKey(this.sortingKey);
      } else {
        promise2 = Vue.Promise.resolve();
      }

      Vue.Promise.all([promise1, promise2]).finally(this.finishLoading);
    },
    gotAnnotations(label, filters, response) {
      let imageAnnotations = response[0].data;
      let videoAnnotations = response[1].data;

      // This is the object that we will use to store information for each
      // annotation patch.
      let annotations = [];

      if (imageAnnotations) {
        annotations = annotations.concat(
          this.initAnnotations(label, imageAnnotations, IMAGE_ANNOTATION)
        );
      }

      if (videoAnnotations) {
        annotations = annotations.concat(
          this.initAnnotations(label, videoAnnotations, VIDEO_ANNOTATION)
        );
      }
      // Show the newest annotations (with highest ID) first.
      annotations = annotations.sort((a, b) => b.id - a.id);

      Vue.set(
        this.annotationsCache,
        this.getSelectedAnnotationName,
        annotations
      );
    },
    initAnnotations(label, annotations, type) {
      return Object.keys(annotations).map(function (id) {
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
    handleSelectedFilters(filters) {
      this.selectedFilters = filters;
      this.getAnnotations(this.selectedLabel, filters);
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
        while (
          response !== null &&
          parseInt(response, 10) !== this.toDeleteCount
        ) {
          response = prompt(
            `This might delete ${this.toDeleteCount} annotation(s). Please enter the number to continue.`
          );
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
      }).then(
        (response) => (this.waitForSessionId = response.body.id),
        (response) => {
          this.finishLoading();
          handleErrorResponse(response);
        }
      );
    },
    handleSessionSaved(event) {
      if (event.id == this.waitForSessionId) {
        this.finishLoading();
        Messages.success(
          "Saved. You can now start a new re-evaluation session."
        );
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
        Messages.danger("There was an unexpected error.");
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
      Echo.getInstance()
        .private(`user-${this.user.id}`)
        .listen(
          ".Biigle\\Modules\\Largo\\Events\\LargoSessionSaved",
          this.handleSessionSaved
        )
        .listen(
          ".Biigle\\Modules\\Largo\\Events\\LargoSessionFailed",
          this.handleSessionFailed
        );
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
        return Vue.Promise.resolve(sequence);
      }

      let promise;
      if (!this.selectedLabel) {
        promise = Vue.Promise.resolve([]);
      } else if (key === SORT_KEY.OUTLIER) {
        promise = this.querySortByOutlier(labelId).then(
          (response) => response.body
        );
      } else if (key === SORT_KEY.SIMILARITY) {
        // Skip cacheing for this sorting method.
        return this.querySortBySimilarity(
          labelId,
          this.similarityReference
        ).then((response) => response.body);
      } else {
        promise = Vue.Promise.resolve([]);
      }

      return promise.then((ids) =>
        this.putSortingSequenceToCache(key, labelId, ids)
      );
    },
    putSortingSequenceToCache(key, labelId, sequence) {
      if (!this.sortingSequenceCache[labelId]) {
        Vue.set(this.sortingSequenceCache, labelId, {});
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
      return this.updateSortKey(SORT_KEY.ANNOTATION_ID).then(
        () => (this.sortingDirection = SORT_DIRECTION.DESCENDING)
      );
    },
  },
  watch: {
    annotations(annotations) {
      Events.$emit("annotations-count", annotations.length);
    },
    dismissedAnnotations(annotations) {
      Events.$emit("dismissed-annotations-count", annotations.length);
    },
    step(step) {
      Events.$emit("step", step);
    },
    selectedLabel() {
      if (this.isInDismissStep) {
        this.$refs.dismissGrid.setOffset(0);
      }
    },
  },
  created() {
    this.user = biigle.$require("largo.user");

    window.addEventListener("beforeunload", (e) => {
      if (this.hasDismissedAnnotations) {
        e.preventDefault();
        e.returnValue = "";

        return "This page is asking you to confirm that you want to leave - data you have entered may not be saved.";
      }
    });

    this.initializeEcho();
  },
};
</script>
