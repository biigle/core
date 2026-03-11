<script>
import Keyboard from '@/core/keyboard.js';
import MagicWandInteraction from '@/annotations/ol/MagicWandInteraction.js';
import Styles from '@/annotations/stores/styles.js';
import ImageLayer from '@biigle/ol/layer/Image';
import CanvasSource from '../../../annotations/ol/source/Canvas.js';
import Projection from '@biigle/ol/proj/Projection';

/**
 * Mixin for the annotationCanvas component that contains logic for the magic wand interaction.
 *
 * @type {Object}
 */
let magicWandInteraction;

export default {
    data() {
        return {
            magicWandVideoLayer: null,
            magicWandvideoCanvas: null,
            projection: null
        };
    },
    computed: {
        isMagicWanding() {
            return this.interactionMode === 'magicWand' && this.video.paused;
        },
    },
    methods: {
        toggleMagicWand() {
            if (this.isMagicWanding) {
                this.resetInteractionMode();
            } else if (magicWandInteraction && this.canAdd) {
                this.interactionMode = 'magicWand';
            }
        },
        updateVideoFrameImage() {
            if (!this.isMagicWanding) {
                return;
            }
            // Update video frame
            let canvasContext = this.magicWandvideoCanvas.getContext('2d');
            canvasContext.drawImage(this.video, 0, 0, this.magicWandvideoCanvas.width, this.magicWandvideoCanvas.height);

            this.magicWandVideoLayer.setSource(new CanvasSource({
                canvas: this.magicWandvideoCanvas,
                projection: this.projection,
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
        initInteraction() {
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
                let geometry = e.feature.getGeometry();
                let pendingAnnotation = {
                    shape: geometry.getType(),
                    frames: [this.video.currentTime],
                    points: [this.getPointsFromGeometry(geometry)],
                };

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
            this.projection = new Projection({
                code: 'biigle-video',
                units: 'pixels',
                extent: [0, 0, this.video.videoWidth, this.video.videoHeight]
            });

            this.magicWandvideoCanvas = document.createElement('canvas');
            this.magicWandvideoCanvas.width = this.video.videoWidth;
            this.magicWandvideoCanvas.height = this.video.videoHeight;

            this.map.addLayer(this.magicWandVideoLayer);
            magicWandInteraction.setLayer(this.magicWandVideoLayer);
        },
        disableMagicWandOnPlay() {
            if (!this.video.paused && this.interactionMode === 'magicWand') {
                this.resetInteractionMode();
            }
        }
    },
    watch: {
        isMagicWanding(isMagicWanding) {
            this.toggleMagicWandInteraction(isMagicWanding);
        },
    },
    created() {
        this.video.addEventListener('loadeddata', this.initInteraction)
        this.video.addEventListener('seeked', this.updateVideoFrameImage)
        this.video.addEventListener('play', this.disableMagicWandOnPlay)
        Keyboard.on('Shift+g', this.toggleMagicWand, 0, this.listenerSet);
    },
};
</script>
