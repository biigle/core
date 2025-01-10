<script>
import CanvasSource from '@/annotations/ol/source/Canvas.js';
import ImageLayer from '@biigle/ol/layer/Image';
import Keyboard from '@/core/keyboard.vue';
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
            renderCurrentTime: -1,
            extent: [0, 0, 0, 0],
            // Allow a maximum of 100x magnification. More cannot be represented in the
            // URL parameters.
            minResolution: 0.01,
            // parameter tracking seeking state specific for frame jump, needed because looking for seeking directly leads to error
            seekingFrame: this.seeking,
            supportsVideoFrameCallback: false,
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

            this.videoCanvas.width = this.extent[2];
            this.videoCanvas.height = this.extent[3];

            this.videoSource = new CanvasSource({
                canvas: this.videoCanvas,
                projection: projection,
                canvasExtent: this.extent,
                canvasSize: [this.extent[2], this.extent[3]],
            });

            this.videoLayer = new ImageLayer({
                name: 'image', // required by the minimap component
                source: this.videoSource,
            });

            // The video layer should always be the first layer, otherwise it will be
            // rendered e.g. above the annotations.
            this.map.getLayers().insertAt(0, this.videoLayer);

            this.map.setView(new View({
                // Center is required but will be updated immediately with fit().
                center: [0, 0],
                projection: projection,
                minResolution: this.minResolution,
                extent: this.extent,
                showFullExtent: true,
                constrainOnlyCenter: true,
                padding: [10, 10, 10, 10],
            }));

            this.map.getView().fit(this.extent);
        },
        renderVideo(force) {
            // Drop animation frame if the time has not changed.
            if (force || this.renderCurrentTime !== this.video.currentTime) {
                this.renderCurrentTime = this.video.currentTime;
                this.videoContext.drawImage(this.video, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
                this.videoSource.changed();
            }
        },
        startRenderLoop() {
            let render;
            if (this.supportsVideoFrameCallback) {
                render = () => {
                    this.renderVideo();
                    this.animationFrameId = this.video.requestVideoFrameCallback(render);
                };
            } else {
                render = () => {
                    this.renderVideo();
                    this.animationFrameId = window.requestAnimationFrame(render);
                };
            }
            render();
            this.map.render();
        },
        stopRenderLoop() {
            if (this.supportsVideoFrameCallback) {
                this.video.cancelVideoFrameCallback(this.animationFrameId);
            } else {
                window.cancelAnimationFrame(this.animationFrameId);
            }
            this.animationFrameId = null;
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
        setPausedAndSeek() {
            this.setPaused();
            // Force render the video frame that belongs to currentTime. This is a
            // workaround because the displayed frame not the one that belongs to
            // currentTime (in most cases). With the workaround we can create annotations
            // at currentTime and be sure that the same frame can be reproduced later for
            // the annotations. See: https://github.com/biigle/core/issues/433
            this.$emit('seek', this.video.currentTime, true);
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
        // 5 next methods are a workaround to get previous and next frames, adapted from here: https://github.com/angrycoding/requestVideoFrameCallback-prev-next/tree/main
        async emitPreviousFrame() {
            if(this.video.currentTime == 0 || this.seekingFrame) return;
            this.$emit('start-seeking');
            this.seekingFrame = true;
            await this.showPreviousFrame();
            this.seekingFrame = false;
        },
        async emitNextFrame() {
            if(this.video.duration - this.video.currentTime == 0 || this.seekingFrame) return;
            this.$emit('start-seeking');
            this.seekingFrame = true;
            await this.showNextFrame();
            this.seekingFrame = false;
        },
        frameInfoCallback() {
            let promise = new Vue.Promise((resolve) => {
                this.video.requestVideoFrameCallback((now, metadata) => {
                    resolve(metadata);
                })
            })
            return promise;
        },
        async showPreviousFrame() {
            try {
                // force rerender adapting step on begining or end of video
                let step = 1;
                if (this.video.currentTime < 1) {
                   step = this.video.currentTime;
                }
                if (this.video.duration - this.video.currentTime < 1) {
                   step = this.video.duration - this.video.currentTime;
                }
                this.video.currentTime += step;
                this.video.currentTime -= step;

                // get current frame time
                const firstMetadata = await this.frameInfoCallback();
                for (;;) {
                    // now adjust video's current time until actual frame time changes
                    this.video.currentTime -= 0.01;
                    // check that we are not at first frame, otherwise we'll end up in infinte loop
                    if (this.video.currentTime == 0) break;
                    const metadata = await this.frameInfoCallback();
                    if (metadata.mediaTime !== firstMetadata.mediaTime) break;
                }
            } catch(e) {console.error(e)}
        },
        async showNextFrame() {
            try {
                // force rerender adapting step on begining or end of video
                let step = 1;
                if (this.video.currentTime < 1) {
                   step = this.video.currentTime;
                }
                if (this.video.duration - this.video.currentTime < 1) {
                   step = this.video.duration - this.video.currentTime;
                }
                this.video.currentTime += step;
                this.video.currentTime -= step;

                // get current frame time
                const firstMetadata = await this.frameInfoCallback();
                for (;;) {
                    // now adjust video's current time until actual frame time changes
                    this.video.currentTime += 0.01;
                    // check that we are not at last frame, otherwise we'll end up in infinte loop
                    if (this.video.duration - this.video.currentTime == 0) break;
                    const metadata = await this.frameInfoCallback();
                    if (metadata.mediaTime !== firstMetadata.mediaTime) break;
                }
            } catch(e) {console.error(e)}
        },
        // Methods to jump back and forward in video. Step is given by parameter jumpStep.
        jumpBackward() {
            if (this.video.currentTime > 0 && this.jumpStep > 0) {
                this.$emit('seek', this.video.currentTime - this.jumpStep);
            }
        },
        jumpForward() {
            if (!this.video.ended && this.jumpStep > 0) {
                this.$emit('seek', this.video.currentTime + this.jumpStep);
            }
        },
    },
    watch: {
        seeking(seeking) {
            if (seeking) {
                this.stopRenderLoop();
            } else if (this.playing) {
                this.startRenderLoop();
            }
        },
    },
    created() {
        this.videoCanvas = document.createElement('canvas');
        this.videoContext = this.videoCanvas.getContext('2d');
        this.video.addEventListener('play', this.setPlaying);
        this.video.addEventListener('pause', this.setPausedAndSeek);
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

        if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
            this.supportsVideoFrameCallback = true;
        }
    },
};
</script>
