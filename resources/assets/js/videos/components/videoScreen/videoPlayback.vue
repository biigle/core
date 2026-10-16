<script>
import CanvasSource from '@/annotations/ol/source/Canvas.js';
import ImageLayer from '@biigle/ol/layer/Image';
import Projection from '@biigle/ol/proj/Projection';
import View from '@biigle/ol/View';
import { Input, ALL_FORMATS, UrlSource, VideoSampleSink } from 'mediabunny';
import Messages from '@/core/messages/store.js';

/**
 * Mixin for the videoScreen component that contains logic for the video playback.
 *
 * @type {Object}
 */
export default {
    emits: [
        'seek',
        'start-seeking',
        'mediabunny-decoding',
    ],
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
            shouldUseVideoFrameCallback: false,
            mediabunnyInput: null,
            mediabunnySink: null,
            mediabunnyInitPromise: null,
            videoSourceRevision: 0,
            mediabunnyDecodeCount: 0,
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
            this.updateMapReadyRevision();
        },
        renderVideo(force) {
            // Drop animation frame if the time has not changed.
            if (!force && this.renderCurrentTime === this.video.currentTime) {
                return;
            }

            this.renderCurrentTime = this.video.currentTime;
            this.drawBitmap(this.video);
        },
        startRenderLoop() {
            let render;
            if (this.shouldUseVideoFrameCallback) {
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
            if (this.shouldUseVideoFrameCallback) {
                this.video.cancelVideoFrameCallback(this.animationFrameId);
            } else {
                window.cancelAnimationFrame(this.animationFrameId);
            }
            this.animationFrameId = null;
        },
        async renderPausedFrame(time = this.video.currentTime) {
            if (!this.video.paused ) {
                this.renderVideo(true);
                return;
            } else if (!this.mediabunnySink) {
                // Use the old hack if mediabunny is not available (unsupported codec, etc.):
                // Assign video.currentTime manually and hope the browser displays the correct frame
                this.video.currentTime = time;
                this.renderVideo(true);
                return;
            }

            await this.getFrameBitmap(time);
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
        async setPausedAndSeek() {
            this.setPaused();
            await this.renderPausedFrame();
        },
        play() {
            this.video.play();
        },
        pause() {
            this.video.pause();
        },
        updateMapReadyRevision() {
            this.mapReadyRevision += 1;
        },
        attachUpdateVideoLayerListener() {
            // Update the layer (dimensions) if a new video is loaded.
            this.video.addEventListener('loadedmetadata', this.updateVideoLayer);
        },
        handleVideoMetadata() {
            this.videoSourceRevision++;
            this.mediabunnySink = null;
            this.mediabunnyInitPromise = this.initMediabunny(this.videoSourceRevision);
        },
        async handleSeeked() {
            await this.renderPausedFrame();
        },
        // 5 next methods are a workaround to get previous and next frames, adapted from here: https://github.com/angrycoding/requestVideoFrameCallback-prev-next/tree/main
        async emitPreviousFrame() {
            if (this.video.currentTime == 0 || this.seekingFrame) return;
            this.$emit('start-seeking');
            this.seekingFrame = true;
            await this.showPreviousFrame();
            this.seekingFrame = false;
        },
        async emitNextFrame() {
            if (this.video.duration - this.video.currentTime == 0 || this.seekingFrame) return;
            this.$emit('start-seeking');
            this.seekingFrame = true;
            await this.showNextFrame();
            this.seekingFrame = false;
        },
        frameInfoCallback() {
            let promise = new Promise((resolve) => {
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
        setShouldUseVideoFrameCallback() {
            this.shouldUseVideoFrameCallback = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
        },
        handleFirefoxFullscreenChange() {
            if (document.fullscreenElement) {
                this.shouldUseVideoFrameCallback = false;
                if (this.playing) {
                    // Restart the render loop with requestAnimationFrame.
                    this.stopRenderLoop();
                    this.startRenderLoop();
                }
            } else {
                this.setShouldUseVideoFrameCallback();
            }
        },
        toggleFirefoxFullscreen() {
            document.body.requestFullscreen();
        },
        async initMediabunny(revision) {
            if (this.mediabunnyInput) {
                this.mediabunnyInput.dispose();
            }
            const input = new Input({
                source: new UrlSource(this.video.src),
                formats: ALL_FORMATS
            });
            const track = await input.getPrimaryVideoTrack();
            if (!track || !(await track.canDecode())) {
                input.dispose();
                this.mediabunnyInput = null;
                this.mediabunnySink = null;
                Messages.warning('The used video codec is not supported by the WebCodecs API. The browser might display incorrect frames for a given timestamp. Consider switching the browser or transcoding the video to a more widely supported codec like H.264 (AVC).');
                return;
            }

            if (revision !== this.videoSourceRevision) {
                input.dispose();
                return;
            }

            this.mediabunnyInput = input;
            this.mediabunnySink = new VideoSampleSink(track);
        },
        async getFrameBitmap(time) {
            const revision = this.videoSourceRevision;
            const source = this.video.src;
            const sourceHasChanged = () => revision !== this.videoSourceRevision || source !== this.video.src;

            this.mediabunnyDecodeCount++;
            this.$emit('mediabunny-decoding', true);
            try {
                await this.mediabunnyInitPromise;

                if (sourceHasChanged()) {
                    return;
                }

                const sample = await this.mediabunnySink.getSample(time);
                const videoFrame = sample.toVideoFrame();
                const bitmap = await createImageBitmap(videoFrame);
                sample.close();
                videoFrame.close();

                if (!this.video.paused || this.video.currentTime !== time || sourceHasChanged()) {
                    bitmap.close();
                    return;
                }

                this.drawBitmap(bitmap);
                bitmap.close();
            } finally {
                this.mediabunnyDecodeCount--;
                this.$emit('mediabunny-decoding', this.mediabunnyDecodeCount > 0);
            }
        },
        drawBitmap(bitmap) {
            this.videoContext.drawImage(bitmap, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
            this.videoSource.changed();
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
        this.video.addEventListener('loadedmetadata', this.handleVideoMetadata);

        let mapPromise = new Promise((resolve) => {
            this.$watch('map', {
                once: true,
                handler(map) {
                    resolve(map);
                },
            });
        });

        let metadataPromise;
        // If the video screen is shown in the popup and the video is already loaded.
        if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            metadataPromise = Promise.resolve();
            this.handleVideoMetadata();
        } else {
            metadataPromise = new Promise((resolve) => {
                this.video.addEventListener('loadedmetadata', resolve);
            });
        }

        Promise.all([mapPromise, metadataPromise])
            .then(this.updateVideoLayer)
            .then(this.attachUpdateVideoLayerListener)
            .then(() => {
                // If the video screen is shown in the popup and the video is already
                // loaded.
                if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    this.renderVideo();

                    if (!this.video.paused) {
                        this.setPlaying();
                    }
                }
            });

        this.$watch('hasError', (hasError) => {
            if (this.videoLayer) {
                this.videoLayer.setVisible(!hasError);
            }
        });

        // If in Firefox and in the video popup and in "F11 fullscreen" or actual
        // fullscreen mode then the video playback with requestVideoFrameCallback does
        // not work. Presumably, this is because the video lives in the parent
        // window which is now invisible. This detects the state and switches to
        // requestAnimationFrame instead. To reliably detect the state we add an F11
        // event listener and switch to actual fullscreen mode instead of allowing the
        // "F11 fullscreen" mode of Firefox which cannot be reliably detected.
        if (this.showClosePopoutButton && navigator.userAgent.toLowerCase().includes('firefox')) {
            this.keyboardOn('F11', this.toggleFirefoxFullscreen, 0, this.listenerSet);
            document.addEventListener("fullscreenchange", this.handleFirefoxFullscreenChange);
        }

        this.setShouldUseVideoFrameCallback();
    },
    beforeUnmount() {
        // Cleanup is important because the videoScreen can be created and destroyed with
        // with the video popout feature.
        this.video.removeEventListener('play', this.setPlaying);
        this.video.removeEventListener('pause', this.setPausedAndSeek);
        this.video.removeEventListener('seeked', this.handleSeeked);
        this.video.removeEventListener('loadeddata', this.renderVideo);
        this.video.removeEventListener('loadedmetadata', this.handleVideoMetadata);
        if (this.mediabunnyInput) {
            this.mediabunnyInput.dispose();
        }
    },
};
</script>
