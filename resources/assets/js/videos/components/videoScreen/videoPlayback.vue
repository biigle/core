<script>
import CanvasSource from '@biigle/ol/source/Canvas';
import ImageLayer from '@biigle/ol/layer/Image';
import Keyboard from '../../../core/keyboard';
import Projection from '@biigle/ol/proj/Projection';
import View from '@biigle/ol/View';

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
            this.videoCanvas.width = this.video.videoWidth;
            this.videoCanvas.height = this.video.videoHeight;
            this.extent = [0, 0, this.videoCanvas.width, this.videoCanvas.height];
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
                    canvas: this.videoCanvas,
                    projection: projection,
                    canvasExtent: this.extent,
                    canvasSize: [this.extent[0], this.extent[1]],
                }),
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
                this.videoCanvasCtx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
                this.videoLayer.changed();

                let now = Date.now();
                if (force || (now - this.refreshLastTime) >= this.refreshRate) {
                    this.$emit('refresh', this.video.currentTime);
                    this.refreshLastTime = now;
                }
            }
        },
        startRenderLoop() {
            this.renderVideo();
            this.animationFrameId = window.requestAnimationFrame(this.startRenderLoop);
        },
        stopRenderLoop() {
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            // Make sure the video frame that belongs to the currentTime is drawn.
            this.renderVideo(true);
        },
        setPlaying() {
            this.playing = true;
        },
        setPaused() {
            this.playing = false;
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
            this.renderVideo(true);
        },
        emitMapReady() {
            this.$emit('map-ready', this.map);
        },
        attachUpdateVideoLayerListener() {
            // Update the layer (dimensions) if a new video is loaded.
            this.video.addEventListener('loadedmetadata', this.updateVideoLayer);
        },
    },
    watch: {
        playing(playing) {
            if (playing && !this.animationFrameId) {
                this.startRenderLoop();
            } else if (!playing) {
                this.stopRenderLoop();
            }
        },
    },
    created() {
        this.videoCanvas = document.createElement('canvas');
        this.videoCanvasCtx = this.videoCanvas.getContext('2d');
        this.video.addEventListener('play', this.setPlaying);
        this.video.addEventListener('pause', this.setPaused);
        this.video.addEventListener('seeked', this.renderVideo);
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
