import { ref, computed, watch, nextTick } from 'vue';
import { required } from '@/utils.js';
import { urlParams as UrlParams } from '@/core/utils.js';
import Events from '@/core/events.js';


export function useVolareMode({
    filteredAnnotations = required('filteredAnnotations'),
    selectedAnnotations = required('selectedAnnotations'),
    focusAnnotationInCanvas = required('focusAnnotationInCanvas'),
    fitImageInCanvas = required('fitImageInCanvas'),
    volareModeIsActive = required('volareModeIsActive'),
    annotationFilter = required('annotationFilter'),
    image = required('image')
}) {
    const focussedAnnotationIndex = ref(null);
    const userUpdateVolareResolution = ref(false);
    const requestedImageId = ref(null);
    let pendingVolareState = null;
    let savedState = null;

    const focussedAnnotation = computed(() => {
        return filteredAnnotations.value[focussedAnnotationIndex.value];
    });

    function selectAndFocusAnnotation(annotation, keepResolution = false) {
        selectedAnnotations.value.forEach(a => {
            a.selected = false;
        });
        annotation.selected = true;
        focusAnnotationInCanvas(annotation, true, keepResolution);
    }

    function updateFocussedAnnotation() {
        if (!volareModeIsActive.value) {
            focussedAnnotationIndex.value = null;
            return;
        } else if (filteredAnnotations.value.length === 0) {
            // Show the whole image if there are no annotations.
            focussedAnnotationIndex.value = null;
            fitImageInCanvas();
            return;
        }

        if (focussedAnnotationIndex.value === Infinity) {
            // Show the last annotation if the previous image is shown.
            focussedAnnotationIndex.value = filteredAnnotations.value.length - 1;
        } else {
            // Show the first annotation if the next image is shown or
            // the annotation filter changed.
            focussedAnnotationIndex.value = 0;
        }
    }

    function handleNextAnnotation() {
        if (!volareModeIsActive.value) {
            return false;
        }

        if (focussedAnnotationIndex.value < (filteredAnnotations.value.length - 1)) {
            focussedAnnotationIndex.value++;
            return true;
        } else if (focussedAnnotationIndex.value === Infinity) {
            // This may happen if the volume has only one image and we can't
            // switch to the next image. Here, we want to go to the second
            // annotation of the image.
            focussedAnnotationIndex.value = Math.min(1, filteredAnnotations.value.length - 1);
        } else {
            // Show the first annotation of the next image in this case, so
            // don't return.
            focussedAnnotationIndex.value = -Infinity;
        }

        return false;
    }

    function handlePreviousAnnotation() {
        if (!volareModeIsActive.value) {
            return false;
        }

        if (focussedAnnotationIndex.value > 0) {
            focussedAnnotationIndex.value--;
            return true;
        } else if (focussedAnnotationIndex.value === -Infinity) {
            // This may happen if the volume has only one image and we can't
            // switch to the next image. Here, we want to go to the second to
            // last annotation of the image.
            focussedAnnotationIndex.value = Math.max(filteredAnnotations.value.length - 2, 0);
        } else {
            // Show the last annotation of the previous image in this case,
            // so don't return.
            focussedAnnotationIndex.value = Infinity;
        }

        return false;
    }

    function saveState() {
        savedState = {
            imageId: image.value.id,
            focussedAnnotationIndex: focussedAnnotationIndex.value,
        };
    }

    function loadState() {
        if (!savedState) {
            return;
        } else if (savedState.imageId !== image.value.id) {
            requestedImageId.value = savedState.imageId;
            return;
        }

        focussedAnnotationIndex.value = null;
        nextTick(() => {
            focussedAnnotationIndex.value = savedState.focussedAnnotationIndex;
            savedState = null;
        });
    }

    watch(focussedAnnotation, (annotation) => {
        if (annotation) {
            selectAndFocusAnnotation(annotation, userUpdateVolareResolution.value);
        }
    });
    watch(() => annotationFilter?.value, updateFocussedAnnotation);
    watch(volareModeIsActive, (enabled) => {
        if (!enabled) {
            userUpdateVolareResolution.value = false;
        }
    });
    watch(() => image?.value, () => {
        nextTick(loadState);
    });

    return {
        focussedAnnotationIndex,
        focussedAnnotation,
        userUpdateVolareResolution,
        selectAndFocusAnnotation,
        updateFocussedAnnotation,
        handleNextAnnotation,
        handlePreviousAnnotation,
        requestedImageId,
        saveState,
        loadState,
    };
}