import { ref, computed, watch } from 'vue';
import { required } from '@/utils';


export function useLawnmowerMode({
    viewExtent = required('viewExtent'),
    image = required('image'),
    map = required('map'),
    emitLawnmowerPreViewportChange = required('emitLawnmowerPreViewportChange'),
    emitLawnmowerPostViewportChange = required('emitLawnmowerPostViewportChange')
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
            Math.ceil(image.width / (viewExtent[2] - viewExtent[0])),
            Math.ceil(image.height / (viewExtent[3] - viewExtent[1])),
        ];
    });

    // Center position of the first image section [0, 0].
    const imageSectionStartCenter = computed(() => {
        let startCenter = [
            (viewExtent[2] - viewExtent[0]) / 2,
            (viewExtent[3] - viewExtent[1]) / 2,
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
            viewExtent[2] - viewExtent[0],
            viewExtent[3] - viewExtent[1],
        ];
        let overlap;
        if (imageSectionSteps[0] > 1) {
            overlap = (stepSize[0] * imageSectionSteps[0]) - image.width;
            stepSize[0] -= overlap / (imageSectionSteps[0] - 1);
        } else {
            stepSize[0] = viewExtent[2];
        }

        if (imageSectionSteps[1] > 1) {
            overlap = (stepSize[1] * imageSectionSteps[1]) - image.height;
            stepSize[1] -= overlap / (imageSectionSteps[1] - 1);
        } else {
            stepSize[1] = viewExtent[3];
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
            emitLawnmowerPreViewportChange();
            imageSection = section;
            // Don't make imageSectionCenter a computed property because it
            // would automatically update when the resolution changes. But we
            // need the old value to compute the new image section in the
            // resolution watcher first!
            imageSectionCenter = getImageSectionCenter(section);
            map.getView().setCenter(imageSectionCenter);
            map.once('rendercomplete', () => {
                emitLawnmowerPostViewportChange();
            });
            return true;
        }

        return false;
    }
}
