/**
 * Mixin for the annotationCanvas component that contains logic for Lawnmower Mode.
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            // The image section information is needed for the lawnmower cycling mode
            // Index of the current image section in x and y direction.
            imageSection: [0, 0],
            // Actual center point of the current image section.
            imageSectionCenter: [0, 0],
        };
    },
    computed: {
        // Number of available image sections in x and y direction.
        imageSectionSteps() {
            return [
                Math.ceil(this.image.width / (this.viewExtent[2] - this.viewExtent[0])),
                Math.ceil(this.image.height / (this.viewExtent[3] - this.viewExtent[1])),
            ];
        },
        // Distance to travel between image sections in x and y direction.
        imageSectionStepSize() {
            let stepSize = [
                this.viewExtent[2] - this.viewExtent[0],
                this.viewExtent[3] - this.viewExtent[1],
            ];
            let overlap;
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
        imageSectionStartCenter() {
            let startCenter = [
                (this.viewExtent[2] - this.viewExtent[0]) / 2,
                (this.viewExtent[3] - this.viewExtent[1]) / 2,
            ];

            if (this.imageSectionSteps[0] <= 1) {
                startCenter[0] = this.extent[2] / 2;
            }

            if (this.imageSectionSteps[1] <= 1) {
                startCenter[1] = this.extent[3] / 2;
            }

            return startCenter;
        },
        isLawnmowerAnnotationMode() {
            return this.annotationMode === 'lawnmower';
        },
    },
    methods: {
        // Calculate the center point of an image section based on its index in x and
        // y direction (e.g. [0, 0] for the first section).
        getImageSectionCenter(section) {
            return [
                section[0] * this.imageSectionStepSize[0] + this.imageSectionStartCenter[0],
                section[1] * this.imageSectionStepSize[1] + this.imageSectionStartCenter[1],
            ];
        },
        showImageSection(section) {
            if (section[0] < this.imageSectionSteps[0] && section[1] < this.imageSectionSteps[1] && section[0] >= 0 && section[1] >= 0) {
                this.imageSection = section;
                // Don't make imageSectionCenter a computed property because it
                // would automatically update when the resolution changes. But we
                // need the old value to compute the new image section in the
                // resolution watcher first!
                this.imageSectionCenter = this.getImageSectionCenter(section);
                this.map.getView().setCenter(this.imageSectionCenter);
                return true;
            }

            return false;
        },
        showLastImageSection() {
            this.showImageSection([
                this.imageSectionSteps[0] - 1,
                this.imageSectionSteps[1] - 1,
            ]);
        },
        showFirstImageSection() {
            this.showImageSection([0, 0]);
        },
        showPreviousImageSection() {
            let x = this.imageSection[0] - 1;
            if (x >= 0) {
                return this.showImageSection([x, this.imageSection[1]]);
            } else {
                return this.showImageSection([
                    this.imageSectionSteps[0] - 1,
                    this.imageSection[1] - 1,
                ]);
            }
        },
        showNextImageSection() {
            let x = this.imageSection[0] + 1;
            if (x < this.imageSectionSteps[0]) {
                return this.showImageSection([x, this.imageSection[1]]);
            } else {
                return this.showImageSection([0, this.imageSection[1] + 1]);
            }
        },
    },
    watch: {
        // Update the current image section if either the resolution or the map size
        // changed. viewExtent depends on both so we can use it as watcher.
        viewExtent() {
            if (!this.isLawnmowerAnnotationMode || !Number.isInteger(this.imageSectionSteps[0]) || !Number.isInteger(this.imageSectionSteps[1])) {
                return;
            }
            let distance = function (p1, p2) {
                return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
            };

            let nearest = Infinity;
            let current = 0;
            let nearestStep = [0, 0];
            for (let y = 0; y < this.imageSectionSteps[1]; y++) {
                for (let x = 0; x < this.imageSectionSteps[0]; x++) {
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
    },
};
