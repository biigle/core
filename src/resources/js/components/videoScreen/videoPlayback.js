/**
 * Mixin for the videoScreen component that contains logic for the video playback.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.videoPlayback', function () {
    return {
        data: function () {
            return {
                playing: false,
                animationFrameId: null,
                // Refresh the annotations only every x ms.
                refreshRate: 30,
                renderCurrentTime: -1,
                refreshLastTime: Date.now(),
                extent: [0, 0, 0, 0],
                minResolution: 0.25,
            };
        },
        computed: {
            //
        },
        methods: {
            initVideoLayer: function (args) {
                var map = args[0];
                this.videoCanvas.width = this.video.videoWidth;
                this.videoCanvas.height = this.video.videoHeight;
                this.extent = [0, 0, this.videoCanvas.width, this.videoCanvas.height];
                var projection = new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent,
                });

                this.videoLayer = new ol.layer.Image({
                    name: 'image', // required by the minimap component
                    source: new ol.source.Canvas({
                        canvas: this.videoCanvas,
                        projection: projection,
                        canvasExtent: this.extent,
                        canvasSize: [this.extent[0], this.extent[1]],
                    }),
                });

                map.addLayer(this.videoLayer);

                map.setView(new ol.View({
                    projection: projection,
                    // zoomFactor: 2,
                    minResolution: this.minResolution,
                    extent: this.extent
                }));

                map.getView().fit(this.extent);
            },
            renderVideo: function () {
                // Drop animation frame if the time has not changed.
                if (this.renderCurrentTime !== this.video.currentTime) {
                    this.renderCurrentTime = this.video.currentTime;
                    this.videoCanvasCtx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
                    this.videoLayer.changed();

                    var now = Date.now();
                    if (now - this.refreshLastTime >= this.refreshRate) {
                        this.$emit('refresh', this.video.currentTime);
                        this.refreshLastTime = now;
                    }
                }
            },
            startRenderLoop: function () {
                this.renderVideo();
                this.animationFrameId = window.requestAnimationFrame(this.startRenderLoop);
            },
            stopRenderLoop: function () {
                window.cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            },
            setPlaying: function () {
                this.playing = true;
            },
            setPaused: function () {
                this.playing = false;
            },
            togglePlaying: function () {
                if (this.playing) {
                    this.pause();
                } else {
                    this.play();
                }
            },
            play: function () {
                this.video.play();
            },
            pause: function () {
                this.video.pause();
            },
            emitMapReady: function () {
                this.$emit('map-ready', this.map);
            },
        },
        watch: {
            playing: function (playing) {
                if (playing && !this.animationFrameId) {
                    this.startRenderLoop();
                } else if (!playing) {
                    this.stopRenderLoop();
                }
            },
        },
        created: function () {
            this.videoCanvas = document.createElement('canvas');
            this.videoCanvasCtx = this.videoCanvas.getContext('2d');
            this.video.addEventListener('play', this.setPlaying);
            this.video.addEventListener('pause', this.setPaused);
            this.video.addEventListener('seeked', this.renderVideo);
            this.video.addEventListener('loadeddata', this.renderVideo);

            var self = this;
            var mapPromise = new Vue.Promise(function (resolve, reject) {
                self.$once('map-created', resolve);
            });
            var metadataPromise = new Vue.Promise(function (resolve, reject) {
                self.video.addEventListener('loadedmetadata', resolve);
                self.video.addEventListener('error', reject);
            });
            Vue.Promise.all([mapPromise, metadataPromise])
                .then(this.initVideoLayer)
                .then(this.emitMapReady);

            var kb = biigle.$require('keyboard');
            kb.on(' ', this.togglePlaying);
        },
    };
});
