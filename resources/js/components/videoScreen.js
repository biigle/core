biigle.$component('components.videoScreen', {
    template: '<div class="video-screen">' +
        '<div class="controls">' +
            '<div class="btn-group">' +
                '<control-button v-if="playing" icon="fa-pause" title="Pause [Spacebar]" v-on:click="pause"></control-button>' +
                '<control-button v-else icon="fa-play" title="Play [Spacebar]" v-on:click="play"></control-button>' +
            '</div>' +
            '<div class="btn-group">' +
                '<control-button icon="fa-bookmark" title="Create a bookmark [b]" v-on:click="emitCreateBookmark"></control-button>' +
                '<control-button v-if="drawingPoint" icon="fa-check" title="Finish a point annotation" v-on:click="finishDrawPoint" :active="true"></control-button>' +
                '<control-button v-else icon="fa-dot-circle" title="Start a point annotation" v-on:click="startDrawPoint"></control-button>' +
            '</div>' +
        '</div>' +
    '</div>',
    components: {
        controlButton: biigle.$require('components.controlButton'),
    },
    props: {
        video: {
            type: HTMLVideoElement,
            required: true,
        },
        annotations: {
            type: Array,
            default: function () {
                return [];
            },
        },
    },
    data: function () {
        return {
            playing: false,
            animationFrameId: null,
            // Refresh the annotations only every x ms.
            refreshRate: 100,
            refreshLastTime: Date.now(),
            // A map of annotation IDs to OpenLayers feature objects for all currently
            // rendered annotations.
            renderedAnnotationMap: {},
            drawingPoint: false,
            pendingAnnotation: {},
        };
    },
    computed: {
        annotationsPreparedToRender: function () {
            // Extract start and end times of the annotations as well as sort them so
            // they can be accessed fast during rendering.
            return this.annotations.map(function (annotation) {
                    return {
                        id: annotation.id,
                        start: annotation.points.frames[0],
                        end: annotation.points.frames[annotation.points.frames.length - 1],
                        self: annotation,
                    };
                })
                .sort(function (a, b) {
                    return a.start - b.start;
                });
        },
    },
    methods: {
        createMap: function () {
            var map = new ol.Map({
                renderer: 'canvas',
                // controls: [
                //     new ol.control.Zoom(),
                //     new ol.control.ZoomToExtent({
                //         tipLabel: 'Zoom to show whole image',
                //         // fontawesome compress icon
                //         label: '\uf066'
                //     }),
                // ],
                interactions: ol.interaction.defaults({
                    altShiftDragRotate: false,
                    doubleClickZoom: false,
                    keyboard: false,
                    shiftDragZoom: false,
                    pinchRotate: false,
                    pinchZoom: false
                }),
            });

            return map;
        },
        init: function () {
            this.videoCanvas.width = this.video.videoWidth;
            this.videoCanvas.height = this.video.videoHeight;

            var extent = [0, 0, this.videoCanvas.width, this.videoCanvas.height];
            var projection = new ol.proj.Projection({
                code: 'biigle-image',
                units: 'pixels',
                extent: extent,
            });

            this.videoLayer = new ol.layer.Image({
                map: this.map,
                source: new ol.source.Canvas({
                    canvas: this.videoCanvas,
                    projection: this.projection,
                    canvasExtent: extent,
                    canvasSize: [extent[0], extent[1]],
                }),
            });

            this.map.setView(new ol.View({
                projection: projection,
                // zoomFactor: 2,
                minResolution: 0.25,
                extent: extent
            }));

            this.map.getView().fit(extent);
            this.annotationLayer.setMap(this.map);
            this.pendingAnnotationLayer.setMap(this.map);
        },
        createAnnotationLayer: function () {
            this.annotationFeatures = new ol.Collection();

            this.annotationSource = new ol.source.Vector({
                features: this.annotationFeatures,
            });

            this.annotationLayer = new ol.layer.Vector({
                source: this.annotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: biigle.$require('stores.styles').features,
            });

            this.pendingAnnotationSource = new ol.source.Vector();

            this.pendingAnnotationLayer = new ol.layer.Vector({
                opacity: 0.5,
                source: this.pendingAnnotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: biigle.$require('stores.styles').editing,
            });
        },
        renderVideo: function () {
            this.videoCanvasCtx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
            this.videoLayer.changed();

            var now = Date.now();
            if (now - this.refreshLastTime >= this.refreshRate) {
                this.refreshAnnotations(this.video.currentTime);
                this.refreshLastTime = now;
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
        refreshAnnotations: function (time) {
            var source = this.annotationSource;
            var annotations = this.annotationsPreparedToRender;
            var oldRendered = this.renderedAnnotationMap;
            var newRendered = {};
            this.renderedAnnotationMap = newRendered;
            var toCreate = [];
            var annotation;
            var hasRenderedFeatures = false;

            for (var i = 0, length = annotations.length; i < length; i++) {
                // We can skip ahead and break early because of the sorting in the
                // annotationsPreparedToRender array.
                // Check for start!=time in case this is a single frame annotation
                // (start==end). It wwould never be shown otherwise.
                if (annotations[i].end <= time && annotations[i].start !== time) {
                    continue;
                }

                if (annotations[i].start > time) {
                    break;
                }

                annotation = annotations[i];
                hasRenderedFeatures = true;
                if (oldRendered.hasOwnProperty(annotation.id)) {
                    newRendered[annotation.id] = oldRendered[annotation.id];
                    delete oldRendered[annotation.id];
                } else {
                    toCreate.push(annotation.self);
                }
            }

            if (hasRenderedFeatures) {
                Object.values(oldRendered).forEach(function (feature) {
                    source.removeFeature(feature);
                });
            } else {
                source.clear();
            }


            var features = toCreate.map(this.createFeature);
            features.forEach(function (feature) {
                newRendered[feature.getId()] = feature;
            });

            if (features.length > 0) {
                source.addFeatures(features);
            }

            Object.values(newRendered).forEach(function (feature) {
                this.updateGeometry(feature, time);
            }, this);
        },
        invertPointsYAxis: function (points) {
            // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
            // the points. CAUTION: Modifies the array in place!
            // The y axis should be switched from "top to bottom" to "bottom to top"
            // or vice versa. Our database expects ttb, OpenLayers expects btt.

            var height = this.videoCanvas.height;
            for (var i = 1; i < points.length; i += 2) {
                points[i] = height - points[i];
            }

            return points;
        },
        createGeometry: function (shape, coordinates) {
            // Only supports points for now.
            return new ol.geom.Point(this.invertPointsYAxis(coordinates.slice()));
        },
        createFeature: function (annotation) {
            var feature = new ol.Feature(
                this.createGeometry('Point', annotation.points.coordinates[0])
            );

            feature.setId(annotation.id);
            feature.set('annotation', annotation);
            if (annotation.labels && annotation.labels.length > 0) {
                feature.set('color', annotation.labels[0].color);
            }

            return feature;
        },
        updateGeometry: function (feature, time) {
            var annotation = feature.get('annotation');
            var frames = annotation.points.frames;

            if (frames.length <= 1) {
                return;
            }

            var i;
            for (i = frames.length - 1; i >= 0; i--) {
                if (frames[i] <= time) {
                    break;
                }
            }

            var coords = annotation.points.coordinates;
            var progress = (time - frames[i]) / (frames[i + 1] - frames[i]);
            feature.setGeometry(this.createGeometry('Point',
                this.interpolateCoordinates(coords[i], coords[i + 1], progress)));
        },
        interpolateCoordinates: function (coords1, coords2, progress) {
            return coords1.map(function (coord, index) {
                return coord + (coords2[index] - coord) * progress;
            });
        },
        emitCreateBookmark: function () {
            this.$emit('create-bookmark', this.video.currentTime);
        },
        startDrawPoint: function () {
            this.resetPendingAnnotation();
            this.drawingPoint = true;
            this.drawInteraction = new ol.interaction.Draw({
                source: this.pendingAnnotationSource,
                type: 'Point',
                style: biigle.$require('stores.styles').editing,
            });
            this.drawInteraction.on('drawend', this.extendPendingAnnotation);
            this.map.addInteraction(this.drawInteraction);
        },
        finishDrawPoint: function () {
            this.drawingPoint = false;
            this.map.removeInteraction(this.drawInteraction);
            this.pendingAnnotationSource.clear();
            this.$emit('create-annotation', this.pendingAnnotation);
        },
        resetPendingAnnotation: function () {
            this.pendingAnnotation = {
                frames: [],
                coordinates: [],
            };
        },
        extendPendingAnnotation: function (e) {
            var lastFrame = this.pendingAnnotation.frames[this.pendingAnnotation.frames.length - 1];
            if (lastFrame === undefined || lastFrame < this.video.currentTime) {
                this.pendingAnnotation.frames.push(this.video.currentTime);
                this.pendingAnnotation.coordinates.push(
                    this.invertPointsYAxis(e.feature.getGeometry().getCoordinates().slice())
                );
            } else {
                this.pendingAnnotationSource.once('addfeature', function (e) {
                    this.removeFeature(e.feature);
                });
            }
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
        this.map = this.createMap();
        this.videoCanvas = document.createElement('canvas');
        this.videoCanvasCtx = this.videoCanvas.getContext('2d');
        this.video.addEventListener('loadedmetadata', this.init);
        this.video.addEventListener('play', this.setPlaying);
        this.video.addEventListener('pause', this.setPaused);
        this.video.addEventListener('seeked', this.renderVideo);
        this.video.addEventListener('loadeddata', this.renderVideo);
        this.createAnnotationLayer();

        var keyboard = biigle.$require('keyboard');
        keyboard.on(' ', this.togglePlaying);
        keyboard.on('b', this.emitCreateBookmark);
    },
    mounted: function () {
        this.map.setTarget(this.$el);
    },
});
