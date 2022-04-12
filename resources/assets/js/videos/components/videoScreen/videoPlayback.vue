<script>
import CanvasSource from '@biigle/ol/source/Canvas';
import ImageLayer from '@biigle/ol/layer/Image';
import Keyboard from '../../../core/keyboard';
import Projection from '@biigle/ol/proj/Projection';
import View from '@biigle/ol/View';
import {apply as applyTransform} from '@biigle/ol/transform';

/**
 * Mixin for the videoScreen component that contains logic for the video playback.
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            playing: false,
            animationFrameId: null,
            // Refresh the annotations only every x ms.
            refreshRate: 30,
            renderCurrentTime: -1,
            refreshLastTime: Date.now(),
            extent: [0, 0, 0, 0],
            // Allow a maximum of 100x magnification. More cannot be represented in the
            // URL parameters.
            minResolution: 0.01,
        };
    },
    methods: {
        updateVideoLayer() {
            this.extent = [0, 0, this.video.videoWidth, this.video.videoHeight];
            let projection = new Projection({
                code: 'biigle-image',
                units: 'pixels',
                extent: this.extent,
            });

            if (this.videoLayer) {
                this.map.removeLayer(this.videoLayer);
            }

            this.videoLayer = new ImageLayer({
                name: 'image', // required by the minimap component
                source: new CanvasSource({
                    canvas: this.dummyCanvas,
                    projection: projection,
                    canvasExtent: this.extent,
                    canvasSize: [this.extent[2], this.extent[3]],
                }),
            });

            // Based on this: https://stackoverflow.com/a/42902773/1796523
            this.videoLayer.on('postcompose', (event) => {
                let frameState = event.frameState;
                let resolution = frameState.viewState.resolution;
                // Custom implementation of "map.getPixelFromCoordinate" because this
                // layer is rendered both on the map of the main view and on the map of
                // the minimap component (i.e. the map changes).
                let origin = applyTransform(
                    frameState.coordinateToPixelTransform,
                    [0, this.extent[3]]
                );
                let context = event.context;
                context.save();
                context.scale(frameState.pixelRatio, frameState.pixelRatio);
                context.translate(origin[0], origin[1]);

                context.drawImage(this.video, 0, 0, this.extent[2] / resolution, this.extent[3] / resolution);
                context.restore();
            });

            // The video layer should always be the first layer, otherwise it will be
            // rendered e.g. above the annotations.
            this.map.getLayers().insertAt(0, this.videoLayer);

            this.map.setView(new View({
                // Center is required but will be updated immediately with fit().
                center: [0, 0],
                projection: projection,
                // zoomFactor: 2,
                minResolution: this.minResolution,
                extent: this.extent,
            }));

            this.map.getView().fit(this.extent);
        },
        renderVideo(force) {
            // Drop animation frame if the time has not changed.
            if (force || this.renderCurrentTime !== this.video.currentTime) {
                this.renderCurrentTime = this.video.currentTime;
                this.videoLayer.changed();

                let now = Date.now();
                if (force || (now - this.refreshLastTime) >= this.refreshRate) {
                    this.$emit('refresh', this.video.currentTime);
                    this.refreshLastTime = now;
                }
            }
        },
        startRenderLoop() {
            let render = () => {
                this.renderVideo();
                this.animationFrameId = window.requestAnimationFrame(render);
            };
            render();
            this.map.render();
        },
        cancelRenderLoop() {
            this.map.cancelRender();
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        },
        stopRenderLoop() {
            this.cancelRenderLoop();
            // Force render the video frame that belongs to currentTime. This is a
            // workaround because the displayed frame not the one that belongs to
            // currentTime (in most cases). With the workaround we can create annotations
            // at currentTime and be sure that the same frame can be reproduced later for
            // the annotations. See: https://github.com/biigle/core/issues/433
            this.$emit('seek', this.video.currentTime, true);
        },
        setPlaying() {
            this.playing = true;
            if (!this.animationFrameId) {
                this.startRenderLoop();
            }
        },
        setPaused() {
            this.playing = false;
            this.stopRenderLoop();
        },
        togglePlaying() {
            if (this.playing) {
                this.pause();
            } else {
                this.play();
            }
        },
        play() {
            this.video.play();
        },
        pause() {
            this.video.pause();
        },
        emitMapReady() {
            this.$emit('map-ready', this.map);
        },
        attachUpdateVideoLayerListener() {
            // Update the layer (dimensions) if a new video is loaded.
            this.video.addEventListener('loadedmetadata', this.updateVideoLayer);
        },
        handleSeeked() {
            this.renderVideo(true);
        },
    },
    watch: {
        seeking(seeking) {
            // Explicitly cancel rendering of the map because there could be one
            // animation frame left that would be executed while the video already began
            // seeking and thus render an empty video.
            if (this.playing) {
                if (seeking) {
                    this.cancelRenderLoop();
                } else {
                    this.startRenderLoop();
                }
            }
        },
    },
    created() {
        this.dummyCanvas = document.createElement('canvas');
        this.dummyCanvas.width = 1;
        this.dummyCanvas.height = 1;
        this.video.addEventListener('play', this.setPlaying);
        this.video.addEventListener('pause', this.setPaused);
        this.video.addEventListener('seeked', this.handleSeeked);
        this.video.addEventListener('loadeddata', this.renderVideo);

        let mapPromise = new Vue.Promise((resolve) => {
            this.$once('map-created', resolve);
        });
        let metadataPromise = new Vue.Promise((resolve) => {
            this.video.addEventListener('loadedmetadata', resolve);
        });
        Vue.Promise.all([mapPromise, metadataPromise])
            .then(this.updateVideoLayer)
            .then(this.emitMapReady)
            .then(this.attachUpdateVideoLayerListener);

        Keyboard.on(' ', this.togglePlaying);

        this.$watch('hasError', (hasError) => {
            if (this.videoLayer) {
                this.videoLayer.setVisible(!hasError);
            }
        });
    },
};
</script>
