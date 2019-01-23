biigle.$component('videos.components.videoScreen', {
    template: '<div class="video-screen">' +
        '<div class="controls">' +
            '<div class="btn-group">' +
                '<control-button v-if="playing" icon="fa-pause" title="Pause 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿" v-on:click="pause"></control-button>' +
                '<control-button v-else icon="fa-play" title="Play 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿" v-on:click="play"></control-button>' +
            '</div>' +
            '<div class="btn-group">' +
                '<control-button v-if="drawingPoint" icon="fa-check" title="Finish a point annotation" v-on:click="finishDrawPoint" :active="true"></control-button>' +
                '<control-button v-else icon="icon-point" title="Start a point annotation" v-on:click="startDrawPoint" :disabled="hasNoSelectedLabel"></control-button>' +
            '</div>' +
            '<div class="btn-group">' +
                '<control-button icon="fa-project-diagram" title="Automatically track the selected annotations" v-on:click="emitTrack" :disabled="hasNoSelectedAnnotations"></control-button>' +
            '</div>' +
            '<div class="btn-group">' +
                '<control-button icon="fa-trash" title="Delete selected annotations" v-on:click="emitDelete" :disabled="!hasSelectedAnnotations"></control-button>' +
                '<control-button icon="fa-bookmark" title="Create a bookmark 𝗯" v-on:click="emitCreateBookmark"></control-button>' +
            '</div>' +
        '</div>' +
    '</div>',
    components: {
        controlButton: biigle.$require('annotations.components.controlButton'),
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
        selectedAnnotations: {
            type: Array,
            default: function () {
                return [];
            },
        },
        selectedLabel: {
            type: Object,
        },
    },
    data: function () {
        return {
            playing: false,
            animationFrameId: null,
            // Refresh the annotations only every x ms.
            refreshRate: 30,
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
                        start: annotation.frames[0],
                        end: annotation.frames[annotation.frames.length - 1],
                        self: annotation,
                    };
                })
                .sort(function (a, b) {
                    return a.start - b.start;
                });
        },
        hasNoSelectedLabel: function () {
            return !this.selectedLabel;
        },
        hasSelectedAnnotations: function () {
            return this.selectedAnnotations.length > 0;
        },
        hasNoSelectedAnnotations: function () {
            return !this.hasSelectedAnnotations;
        },
        annotationLength: function () {
            return this.annotations.length;
        },
    },
    methods: {
        createMap: function () {
            var map = new ol.Map({
                renderer: 'canvas',
                controls: [
                    new ol.control.Zoom(),
                    new ol.control.ZoomToExtent({
                        tipLabel: 'Zoom to show whole video',
                        // fontawesome compress icon
                        label: '\uf066'
                    }),
                ],
                interactions: ol.interaction.defaults({
                    altShiftDragRotate: false,
                    doubleClickZoom: false,
                    keyboard: false,
                    shiftDragZoom: false,
                    pinchRotate: false,
                    pinchZoom: false
                }),
            });

            var ZoomToNativeControl = biigle.$require('annotations.ol.ZoomToNativeControl');
            map.addControl(new ZoomToNativeControl({
                // fontawesome expand icon
                label: '\uf065'
            }));

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
            this.map.addInteraction(this.selectInteraction);
        },
        createAnnotationLayer: function () {
            var styles = biigle.$require('annotations.stores.styles');

            this.annotationFeatures = new ol.Collection();

            this.annotationSource = new ol.source.Vector({
                features: this.annotationFeatures,
            });

            this.annotationLayer = new ol.layer.Vector({
                source: this.annotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: styles.features,
            });

            this.pendingAnnotationSource = new ol.source.Vector();

            this.pendingAnnotationLayer = new ol.layer.Vector({
                opacity: 0.5,
                source: this.pendingAnnotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: styles.editing,
            });

            this.selectInteraction = new ol.interaction.Select({
                condition: ol.events.condition.click,
                style: styles.highlight,
                layers: [this.annotationLayer],
                multi: true
            });

            this.selectedFeatures = this.selectInteraction.getFeatures();
            this.selectInteraction.on('select', this.handleFeatureSelect);
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
            var selected = this.selectedFeatures;
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
                    selected.remove(feature);
                });
            } else {
                source.clear();
                selected.clear();
            }


            var features = toCreate.map(this.createFeature);
            features.forEach(function (feature) {
                newRendered[feature.getId()] = feature;
                if (feature.get('annotation').selected !== false) {
                    selected.push(feature);
                }
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
                this.createGeometry('Point', annotation.points[0])
            );

            feature.setId(annotation.id);
            feature.set('annotation', annotation);
            if (annotation.labels && annotation.labels.length > 0) {
                feature.set('color', annotation.labels[0].label.color);
            }

            return feature;
        },
        updateGeometry: function (feature, time) {
            var annotation = feature.get('annotation');
            var frames = annotation.frames;

            if (frames.length <= 1) {
                return;
            }

            var i;
            for (i = frames.length - 1; i >= 0; i--) {
                if (frames[i] <= time) {
                    break;
                }
            }

            var points = annotation.points;
            var progress = (time - frames[i]) / (frames[i + 1] - frames[i]);
            feature.setGeometry(this.createGeometry('Point',
                this.interpolatePoints(points[i], points[i + 1], progress)));
        },
        interpolatePoints: function (point1, point2, progress) {
            return point1.map(function (value, index) {
                return value + (point2[index] - value) * progress;
            });
        },
        emitCreateBookmark: function () {
            this.$emit('create-bookmark', this.video.currentTime);
        },
        startDrawPoint: function () {
            if (this.hasNoSelectedLabel) {
                return;
            }

            this.pause();
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
                points: [],
            };
        },
        extendPendingAnnotation: function (e) {
            var lastFrame = this.pendingAnnotation.frames[this.pendingAnnotation.frames.length - 1];
            if (lastFrame === undefined || lastFrame < this.video.currentTime) {
                this.pendingAnnotation.frames.push(this.video.currentTime);
                this.pendingAnnotation.points.push(
                    this.invertPointsYAxis(e.feature.getGeometry().getCoordinates().slice())
                );
            } else {
                this.pendingAnnotationSource.once('addfeature', function (e) {
                    this.removeFeature(e.feature);
                });
            }

            if (this.video.currentTime < this.video.duration) {
                this.play();
                setTimeout(this.pause, 1000);
            }
        },
        handleFeatureSelect: function (e) {
            this.$emit('select',
                e.selected.map(function (feature) {
                    return feature.get('annotation');
                }),
                e.selected.map(function () {
                    return this.video.currentTime;
                }, this)
            );
        },
        emitDelete: function () {
            if (this.hasSelectedAnnotations) {
                this.$emit('delete');
            }
        },
        emitTrack: function () {
            this.$emit('track');
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
        selectedAnnotations: function (annotations) {
            var source = this.annotationSource;
            var features = this.selectedFeatures;
            var feature;
            features.clear();
            annotations.forEach(function (annotation) {
                feature = source.getFeatureById(annotation.id);
                if (feature) {
                    features.push(feature);
                }
            });
        },
        annotationLength: function () {
            // This is called when an annotation is deleted.
            this.refreshAnnotations(this.video.currentTime);
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

        var self = this;
        biigle.$require('events').$on('sidebar.toggle', function () {
            self.$nextTick(function () {
                self.map.updateSize();
            });
        });
    },
    mounted: function () {
        this.map.setTarget(this.$el);
    },
});
