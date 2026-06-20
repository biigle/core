import { ref, computed, watch, nextTick, readonly } from 'vue';
import { required } from '@/utils.js';
import { urlParams as UrlParams } from '@/core/utils.js';
import Events from '@/core/events.js';
import { PlayPauseState } from '@/core/components/playPause.vue';


export function useVolareMode({
    filteredAnnotations = required('filteredAnnotations'),
    selectedAnnotations = required('selectedAnnotations'),
    focusAnnotationInCanvas = required('focusAnnotationInCanvas'),
    fitImageInCanvas = required('fitImageInCanvas'),
    annotationFilter = required('annotationFilter'),
    image = required('image'),
    mapResolution = required('mapResolution'),
    showImageWithId = required('showImageWithId'),
}) {
    const focussedAnnotationIndex = ref(null);
    const resolutionWasChangedByUser = ref(false);
    const state = ref(PlayPauseState.INACTIVE);
    let resumeContext = null;
    let resuming = false;

    const focussedAnnotation = computed(() => {
        return filteredAnnotations.value[focussedAnnotationIndex.value];
    });

    const volareModeIsActive = computed(() => {
        return state.value === PlayPauseState.ACTIVE;
    });

    function selectAndFocusAnnotation(annotation, keepResolution = false) {
        selectedAnnotations.value.forEach(a => {
            a.selected = false;
        });
        annotation.selected = true;
        focusAnnotationInCanvas(annotation, true, keepResolution);
    }

    function updateFocussedAnnotation() {
        if (resumeContext) {
            return;
        } else if (!volareModeIsActive.value) {
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
            // Show the first annotation of the next image in this case
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
            // Show the last annotation of the previous image in this case
            focussedAnnotationIndex.value = Infinity;
        }

        return false;
    }

    function setState(targetState) {
        const transition = `${state.value}->${targetState}`;

        switch (transition) {
            case 'active->paused':
                pause();
                break;
            case 'paused->active':
                resume();
                break;
            default:
                resumeContext = null;
        }

        state.value = targetState;
    }

    function pause() {
        resumeContext = {
            imageId: image.value.id,
            focussedAnnotationId: focussedAnnotation.value?.id
        };
    }

    function resume() {
        if (!resumeContext) {
            return;
        }

        resuming = true;
        if (resumeContext.imageId !== image.value.id) {
            showImageWithId(resumeContext.imageId);
            return;
        }

        const savedID = resumeContext.focussedAnnotationId;
        resumeContext = null;
        resuming = false;

        focussedAnnotationIndex.value = null;
        nextTick(() => {
            const index = filteredAnnotations.value.findIndex(a => a.id === savedID);
            focussedAnnotationIndex.value = index === -1 ? 0 : index;
        });
    }

    watch(focussedAnnotation, (annotation) => {
        if (volareModeIsActive.value && annotation) {
            selectAndFocusAnnotation(annotation, resolutionWasChangedByUser.value);
        }
    });
    watch(() => annotationFilter?.value, updateFocussedAnnotation);
    watch(volareModeIsActive, (enabled) => {
        if (!enabled) {
            resolutionWasChangedByUser.value = false;
        } else {
            updateFocussedAnnotation();
        }
    });
    watch(() => image?.value, () => {
        if (resuming) {
            nextTick(resume);
        } else if (volareModeIsActive.value) {
            nextTick(updateFocussedAnnotation);
        }
    });
    watch(mapResolution, () => {
        if (volareModeIsActive.value) {
            resolutionWasChangedByUser.value = true;
        }
    });

    return {
        selectAndFocusAnnotation,
        handleNextAnnotation,
        handlePreviousAnnotation,
        setState,
        volareModeIsActive,
        state: readonly(state),
    };
}