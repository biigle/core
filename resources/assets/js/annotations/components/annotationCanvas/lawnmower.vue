<script>
export const LawnmowerSaveState = Object.freeze({
    SAVE: 'save',
    LOAD: 'load',
    DISCARD: 'discard'
});

export default {
    emits: [
        'restore-lawnmower-image',
        'lawnmower-pre-viewport-change',
        'lawnmower-post-viewport-change',
        'restore-lawnmower-pause-state',
    ],
    props: {
        lawnmowerSaveState: {
            type: String,
            required: true
        }
    },
    computed: {
        isLawnmowerAnnotationMode() {
            return this.annotationMode === 'lawnmower';
        },
    },
    methods: {
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
        getLawnmowerStorageKey() {
            const volumeId = biigle.$require('annotations.volumeId');
            return `lawnmower-state-${volumeId}`;
        },
        saveCurrentLawnmowerState() {
            // After a page reload the image() watcher may restore the lawnmower state lawnmowerPaused,
            // which also triggers this function. In that case we don't want to save the current state
            if (this.getSavedLawnmowerState()) {
                return;
            }
            const view = this.map.getView();
            const state = {
                imageId: this.image.id,
                center: view.getCenter(),
                resolution: view.getResolution(),
                imageSection: [...this.imageSection],
                timestamp: Date.now(),
            };

            localStorage.setItem(
                this.getLawnmowerStorageKey(),
                JSON.stringify(state)
            );
        },
        discardSavedLawnmowerState() {
            localStorage.removeItem(this.getLawnmowerStorageKey());
        },
        getSavedLawnmowerState() {
            const raw = localStorage.getItem(this.getLawnmowerStorageKey());
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        },
        loadSavedLawnmowerState() {
            const state = this.getSavedLawnmowerState();
            if (!state) {
                return;
            }

            if (state.imageId !== this.image?.id) {
                this.restoringLawnmowerImageInProgress = true;
                this.$emit('restore-lawnmower-image', state.imageId);
                return;
            }

            this.applySavedLawnmowerState();
        },
        applySavedLawnmowerState() {
            const state = this.getSavedLawnmowerState();
            if (!state || !this.image || state.imageId !== this.image.id) {
                return;
            }

            this.$emit('lawnmower-pre-viewport-change');
            const view = this.map.getView();

            // In case the map has been resized, getImageSectionForCenter needs the
            // current map size for calculating the new grid position
            this.map.updateSize();
            this.updateMapSize();

            view.setResolution(state.resolution);
            this.$nextTick(() => {
                this.imageSectionCenter = state.center;
                this.imageSection = this.getImageSectionForCenter(state.center);
                view.setCenter(state.center);
                this.discardSavedLawnmowerState();
                this.map.once('rendercomplete', () => {
                    this.$emit('lawnmower-post-viewport-change');
                });
            });
        },
    },
    watch: {
        image() {
            const state = this.getSavedLawnmowerState();
            if (this.pageReloaded) {
                if (state) {
                    this.$emit('restore-lawnmower-pause-state', state.timestamp);
                }
                this.pageReloaded = false;

                return;
            }

            if (state && this.restoringLawnmowerImageInProgress) {
                this.$nextTick(() => this.applySavedLawnmowerState());
                this.restoringLawnmowerImageInProgress = false;
            }
        },
        lawnmowerSaveState(newState) {
            switch(newState) {
                case LawnmowerSaveState.SAVE:
                    this.saveCurrentLawnmowerState();
                    break;
                case LawnmowerSaveState.LOAD:
                    this.loadSavedLawnmowerState();
                    break;
                case LawnmowerSaveState.DISCARD:
                    this.discardSavedLawnmowerState();
                    break;
            }
        },
    },
};
</script>
