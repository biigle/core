<script>
import Keyboard from '@/core/keyboard.js';
import MagicWandInteraction from '@/annotations/ol/MagicWandInteraction.js';
import Styles from '@/annotations/stores/styles.js';
import ImageLayer from '@biigle/ol/layer/Image';
import CanvasSource from '../../../annotations/ol/source/Canvas.js';
import Projection from '@biigle/ol/proj/Projection';

// TODO: Close button group in video screen if video is playing

/**
 * Mixin for the annotationCanvas component that contains logic for the magic wand interaction.
 *
 * @type {Object}
 */
let magicWandInteraction;

export default {
    data() {
        return {
            videoLayer: null,
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
        maybeSetMagicWandLayer() {
            if (this.video === null || this.video.currentTime === null) {
                return
            }

            if (this.map.getLayers().getArray().find(layer => layer.get('name') == 'videoLayer') != undefined) {
                this.map.removeLayer(this.videoLayer)
                this.videoLayer = null;
            }

            let videoCanvas = document.createElement('canvas')
            let canvasContext = videoCanvas.getContext('2d');

            videoCanvas.width = this.video.videoWidth;
            videoCanvas.height = this.video.videoHeight;
            canvasContext.drawImage(this.video, 0, 0, videoCanvas.width, videoCanvas.height);

            this.videoLayer = new ImageLayer();
            let projection = new Projection({
                code: 'biigle-video',
                units: 'pixels',
                extent: [0, 0, this.video.width, this.video.height]
            });

            this.videoLayer.setSource(new CanvasSource({
                canvas: videoCanvas,
                projection: projection,
                canvasExtent: [0, 0, videoCanvas.width, videoCanvas.height],
                canvasSize: [videoCanvas.width, videoCanvas.height],
            }));
            this.videoLayer.set('name', 'videoLayer')
            this.videoLayer.setZIndex(-1);
            this.map.addLayer(this.videoLayer);
            magicWandInteraction.setLayer(this.videoLayer);
            magicWandInteraction.updateSnapshot()
        },
        toggleMagicWandInteraction(isMagicWanding) {
            if (!isMagicWanding) {
                magicWandInteraction.setActive(false);
            } else if (this.hasSelectedLabel || this.labelbotIsActive) {
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
            });
            magicWandInteraction.on('drawend', (e) => {
                let pendingAnnotation = {
                    shape: 'Polygon',
                    frames: [this.video.currentTime],
                    points: [this.convertPointsFromOlToDb(e.feature.getGeometry().getCoordinates()[0])],
                };
                this.$emit('pending-annotation', pendingAnnotation);
                this.annotationSource.once('addfeature', () => {
                    this.$emit('create-annotation', pendingAnnotation);
                    this.$emit('pending-annotation', null);
                });
            }); // call video handle new feature
            magicWandInteraction.setActive(false);
            this.map.addInteraction(magicWandInteraction);
            this.maybeSetMagicWandLayer();
        },
    },
    watch: {
        isMagicWanding(isMagicWanding) {
            this.toggleMagicWandInteraction(isMagicWanding);
        },
    },
    created() {
        this.$watch('initialized', this.initInteraction);
        // TODO: add jump and seek event
        this.video.addEventListener('pause', this.maybeSetMagicWandLayer)
        this.video.addEventListener('seeked', this.maybeSetMagicWandLayer)
        Keyboard.on('Shift+g', this.toggleMagicWand, 0, this.listenerSet);
    },
};
</script>
