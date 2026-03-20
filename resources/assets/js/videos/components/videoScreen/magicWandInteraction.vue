<script>
import Keyboard from '@/core/keyboard.js';
import MagicWandInteraction from '@/annotations/ol/MagicWandInteraction.js';
import Styles from '@/annotations/stores/styles.js';
import ImageLayer from '@biigle/ol/layer/Image';
import CanvasSource from '../../../annotations/ol/source/Canvas.js';
import Projection from '@biigle/ol/proj/Projection';

/**
 * Mixin for the videoScreen component that contains logic for the magic wand interaction.
 *
 * @type {Object}
 */
let magicWandInteraction;

export default {
    data() {
        return {
            magicWandVideoLayer: null,
            magicWandvideoCanvas: null,
            enableMagicWand: false,
        };
    },
    computed: {
        isMagicWanding() {
            return this.interactionMode === 'magicWand' && this.video.paused;
        },
        canMagicWanding() {
            return this.canAddMagicWandAnnotation && this.initializedMagicWand;
        },
        canAddMagicWandAnnotation() {
            return !this.videoHasCorsError && this.canAdd;
        },
        initializedMagicWand() {
            return this.magicWandVideoLayer != null && this.magicWandvideoCanvas != null;
        }
    },
    methods: {
        toggleMagicWand() {
            if (this.isMagicWanding) {
                this.resetInteractionMode();
            } else if (magicWandInteraction && this.enableMagicWand) {
                this.interactionMode = 'magicWand';
            }
        },
        updateVideoFrameImage() {
            if (!this.isMagicWanding) {
                return;
            }

            // Set the projection and canvas size here since a video change could have happened after the last update
            const projection = new Projection({
                code: 'biigle-video',
                units: 'pixels',
                extent: [0, 0, this.video.videoWidth, this.video.videoHeight]
            });

            this.magicWandvideoCanvas.width = this.video.videoWidth;
            this.magicWandvideoCanvas.height = this.video.videoHeight;

            // Update video frame
            let canvasContext = this.magicWandvideoCanvas.getContext('2d');
            canvasContext.drawImage(this.video, 0, 0, this.magicWandvideoCanvas.width, this.magicWandvideoCanvas.height);

            this.magicWandVideoLayer.setSource(new CanvasSource({
                canvas: this.magicWandvideoCanvas,
                projection: projection,
                canvasExtent: [0, 0, this.magicWandvideoCanvas.width, this.magicWandvideoCanvas.height],
                canvasSize: [this.magicWandvideoCanvas.width, this.magicWandvideoCanvas.height],
            }));

            // Set updated video frame
            magicWandInteraction.updateSnapshot()
        },
        toggleMagicWandInteraction(isMagicWanding) {
            if (!isMagicWanding) {
                magicWandInteraction.setActive(false);
            } else if (this.hasSelectedLabel || this.labelbotIsActive) {
                this.updateVideoFrameImage();
                magicWandInteraction.setActive(true);
            } else {
                this.requireSelectedLabel();
            }
        },
        initMagicWandInteraction() {
            if (this.initializedMagicWand || !this.canAddMagicWandAnnotation) {
                return;
            }

            // Initialize the magic wand interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            magicWandInteraction = new MagicWandInteraction({
                map: this.map,
                source: this.annotationSource,
                style: Styles.features,
                indicatorPointStyle: Styles.editing,
                indicatorCrossStyle: Styles.cross,
                simplifyTolerant: 0.1,
                willReadFrequently: true,
            });

            magicWandInteraction.on('drawend', (e) => {
                const geometry = e.feature.getGeometry();
                const points = this.getPointsFromGeometry(geometry);
                let pendingAnnotation = {
                    shape: geometry.getType(),
                    frames: [this.video.currentTime],
                    points: [points],
                };

                // The LabelBOT image is always created because the user could decide to
                // enable LabelBOT while they draw the pending annotation.
                pendingAnnotation.screenshotPromise = this.createLabelbotImage(points);

                this.$emit('pending-annotation', pendingAnnotation);
                this.annotationSource.once('addfeature', () => {
                    this.$emit('create-annotation', pendingAnnotation);
                    this.$emit('pending-annotation', null);
                });
            }); // call video handle new feature

            magicWandInteraction.setActive(false);
            this.map.addInteraction(magicWandInteraction);

            // Create video frame layer and canvas
            this.magicWandVideoLayer = new ImageLayer();
            this.magicWandVideoLayer.setZIndex(-1);

            this.map.addLayer(this.magicWandVideoLayer);
            magicWandInteraction.setLayer(this.magicWandVideoLayer);

            this.magicWandvideoCanvas = document.createElement('canvas');
        },
        disableMagicWandOnPlay() {
            if (!this.video.paused && this.interactionMode === 'magicWand') {
                this.resetInteractionMode();
            }
        },
        toggleEnableMagicWand(e) {
            this.enableMagicWand = e.type === 'pause';
        }
    },
    watch: {
        finishedVideoScreenInit() {
            this.initMagicWandInteraction();
        },
        isMagicWanding(isMagicWanding) {
            this.toggleMagicWandInteraction(isMagicWanding);
        },
        canMagicWanding(usable) {
            this.enableMagicWand = usable;
            if (usable) {
                this.video.addEventListener('seeked', this.updateVideoFrameImage);
                this.video.addEventListener('play', this.disableMagicWandOnPlay);
                this.video.addEventListener('play', this.toggleEnableMagicWand);
                this.video.addEventListener('pause', this.toggleEnableMagicWand);
                Keyboard.on('Shift+g', this.toggleMagicWand, 0, this.listenerSet);
            } else {
                this.video.removeEventListener('seeked', this.updateVideoFrameImage);
                this.video.removeEventListener('play', this.disableMagicWandOnPlay);
                this.video.removeEventListener('play', this.toggleEnableMagicWand);
                this.video.removeEventListener('pause', this.toggleEnableMagicWand);
                Keyboard.off('Shift+g', this.toggleMagicWand, 0, this.listenerSet);
            }
        }
    },
};
</script>
