import { computed, watch, nextTick } from 'vue';
import { required } from '@/utils';

export const LawnmowerEmits = [
    'lawnmower-pre-viewport-change',
    'lawnmower-post-viewport-change',
    'restore-lawnmower-image',
    'restore-lawnmower-pause-state',
];

export function useLawnmowerMode({
    viewExtent = required('viewExtent'),
    image = required('image'),
    map = required('map'),
    emit = required('emit'),
}) {
    // The image section information is needed for the lawnmower cycling mode
    // Index of the current image section in x and y direction.
    let imageSection = [0, 0];
    // Actual center point of the current image section.
    let imageSectionCenter = [0, 0];
    let restoringLawnmowerImageInProgress = false;
    let pageReloaded = true;

    // Number of available image sections in x and y direction.
    const imageSectionSteps = computed(() => {
        return [
            Math.ceil(image.value.width / (viewExtent.value[2] - viewExtent.value[0])),
            Math.ceil(image.value.height / (viewExtent.value[3] - viewExtent.value[1])),
        ];
    });

    // Center position of the first image section [0, 0].
    const imageSectionStartCenter = computed(() => {
        let startCenter = [
            (viewExtent.value[2] - viewExtent.value[0]) / 2,
            (viewExtent.value[3] - viewExtent.value[1]) / 2,
        ];

        if (imageSectionSteps[0] <= 1) {
            startCenter[0] = extent[2] / 2;
        }

        if (imageSectionSteps[1] <= 1) {
            startCenter[1] = extent[3] / 2;
        }

        return startCenter;
    });

    // Distance to travel between image sections in x and y direction.
    const imageSectionStepSize = computed(() => {
        let stepSize = [
            viewExtent.value[2] - viewExtent.value[0],
            viewExtent.value[3] - viewExtent.value[1],
        ];
        let overlap;
        if (imageSectionSteps[0] > 1) {
            overlap = (stepSize[0] * imageSectionSteps[0]) - image.value.width;
            stepSize[0] -= overlap / (imageSectionSteps[0] - 1);
        } else {
            stepSize[0] = viewExtent.value[2];
        }

        if (imageSectionSteps[1] > 1) {
            overlap = (stepSize[1] * imageSectionSteps[1]) - image.value.height;
            stepSize[1] -= overlap / (imageSectionSteps[1] - 1);
        } else {
            stepSize[1] = viewExtent.value[3];
        }
        return stepSize;
    });

    // Calculate the center point of an image section based on its index in x and
    // y direction (e.g. [0, 0] for the first section).
    function getImageSectionCenter(section) {
        return [
            section[0] * imageSectionStepSize[0] + imageSectionStartCenter[0],
            section[1] * imageSectionStepSize[1] + imageSectionStartCenter[1],
        ];
    }

    function getImageSectionForCenter(center) {
        return [
            Math.round(
                (center[0] - imageSectionStartCenter[0]) /
                imageSectionStepSize[0]
            ),
            Math.round(
                (center[1] - imageSectionStartCenter[1]) /
                imageSectionStepSize[1]
            ),
        ].map((index, axis) => Math.max(
            0,
            Math.min(index, imageSectionSteps[axis] - 1)
        ));
    }

    function showImageSection(section) {
        if (section[0] < imageSectionSteps[0] && section[1] < imageSectionSteps[1] && section[0] >= 0 && section[1] >= 0) {
            emit('lawnmower-pre-viewport-change');
            imageSection = section;
            // Don't make imageSectionCenter a computed property because it
            // would automatically update when the resolution changes. But we
            // need the old value to compute the new image section in the
            // resolution watcher first!
            imageSectionCenter = getImageSectionCenter(section);
            map.value.getView().setCenter(imageSectionCenter);
            map.value.once('rendercomplete', () => {
                emit('lawnmower-post-viewport-change');
            });
            return true;
        }

        return false;
    }

    function showLastImageSection() {
        showImageSection([
            imageSectionSteps[0] - 1,
            imageSectionSteps[1] - 1,
        ]);
    }

    function showFirstImageSection() {
        showImageSection([0, 0]);
    }

    function showPreviousImageSection() {
        let x = imageSection[0] - 1;
        if (x >= 0) {
            return showImageSection([x, imageSection[1]]);
        } else {
            return showImageSection([
                imageSectionSteps[0] - 1,
                imageSection[1] - 1,
            ]);
        }
    }

    function showNextImageSection() {
        let x = imageSection[0] + 1;
        if (x < imageSectionSteps[0]) {
            return showImageSection([x, imageSection[1]]);
        } else {
            return showImageSection([0, imageSection[1] + 1]);
        }
    }

    function getLawnmowerStorageKey() {
        const volumeId = biigle.$require('annotations.volumeId');
        return `lawnmower-state-${volumeId}`;
    }

    function saveCurrentLawnmowerState() {
        // After a page reload the image() watcher may restore the lawnmower state lawnmowerPaused,
        // which also triggers this function. In that case we don't want to save the current state
        if (getSavedLawnmowerState()) {
            return;
        }
        const view = map.value.getView();
        const state = {
            imageId: image.value.id,
            center: view.getCenter(),
            resolution: view.getResolution(),
            imageSection: [...imageSection],
            timestamp: Date.now(),
        };

        localStorage.setItem(
            getLawnmowerStorageKey(),
            JSON.stringify(state)
        );
    }

    function discardSavedLawnmowerState() {
        localStorage.removeItem(getLawnmowerStorageKey());
    }

    function getSavedLawnmowerState() {
        const raw = localStorage.getItem(getLawnmowerStorageKey());
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    }

    function loadSavedLawnmowerState() {
        const state = getSavedLawnmowerState();
        if (!state) {
            return;
        }

        if (state.imageId !== image.value?.id) {
            restoringLawnmowerImageInProgress = true;
            emit('restore-lawnmower-image', state.imageId);
            return;
        }

        applySavedLawnmowerState();
    }

    function applySavedLawnmowerState() {
        const state = getSavedLawnmowerState();
        if (!state || !image.value || state.imageId !== image.value.id) {
            return;
        }

        emit('lawnmower-pre-viewport-change');
        const view = map.value.getView();

        // In case the map has been resized, getImageSectionForCenter needs the
        // current map size for calculating the new grid position
        map.value.updateSize();
        updateMapSize();

        view.setResolution(state.resolution);
        nextTick(() => {
            imageSectionCenter = state.center;
            imageSection = getImageSectionForCenter(state.center);
            view.setCenter(state.center);
            discardSavedLawnmowerState();
            map.value.once('rendercomplete', () => {
                emit('lawnmower-post-viewport-change');
            });
        });
    }

    watch(() => image?.value, () => {
        const state = getSavedLawnmowerState();
        if (pageReloaded) {
            if (state) {
                $emit('restore-lawnmower-pause-state', state.timestamp);
            }
            pageReloaded = false;

            return;
        }

        if (state && restoringLawnmowerImageInProgress) {
            nextTick(() => applySavedLawnmowerState());
            restoringLawnmowerImageInProgress = false;
        }
    });

    return {
        showFirstImageSection,
        showLastImageSection,
        showPreviousImageSection,
        showNextImageSection,
        saveCurrentLawnmowerState,
        discardSavedLawnmowerState,
        loadSavedLawnmowerState,
    };
}
