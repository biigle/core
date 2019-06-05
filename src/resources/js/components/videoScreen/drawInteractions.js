/**
 * Mixin for the videoScreen component that contains logic for the draw interactions.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.drawInteractions', function () {
    return {
        data: function () {
            return {
                pendingAnnotation: {},
                autoplayDrawTimeout: null,
            };
        },
        computed: {
            hasSelectedLabel: function () {
                return !!this.selectedLabel;
            },
            hasNoSelectedLabel: function () {
                return !this.selectedLabel;
            },
            isDrawing: function () {
                return this.interactionMode.startsWith('draw');
            },
            isDrawingPoint: function () {
                return this.interactionMode === 'drawPoint';
            },
            isDrawingRectangle: function () {
                return this.interactionMode === 'drawRectangle';
            },
            isDrawingCircle: function () {
                return this.interactionMode === 'drawCircle';
            },
            isDrawingLineString: function () {
                return this.interactionMode === 'drawLineString';
            },
            isDrawingPolygon: function () {
                return this.interactionMode === 'drawPolygon';
            },
            hasPendingAnnotation: function () {
                return this.pendingAnnotation.shape && this.pendingAnnotation.frames.length > 0 && this.pendingAnnotation.points.length > 0;
            },
            cantFinishDrawAnnotation: function () {
                return !this.hasPendingAnnotation;
            },
            cantFinishTrackAnnotation: function () {
                return !this.pendingAnnotation.frames || this.pendingAnnotation.frames.length !== 1;
            },
        },
        methods: {
            initPendingAnnotationLayer: function (map) {
                var styles = biigle.$require('annotations.stores.styles');
                this.pendingAnnotationSource = new ol.source.Vector();
                this.pendingAnnotationLayer = new ol.layer.Vector({
                    opacity: 0.5,
                    source: this.pendingAnnotationSource,
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    style: styles.editing,
                });

                map.addLayer(this.pendingAnnotationLayer);
            },
            draw: function (name) {
                if (this['isDrawing' + name]) {
                    this.resetInteractionMode();
                } else if (this.canAdd && this.hasSelectedLabel) {
                    this.interactionMode = 'draw' + name;
                }
            },
            drawPoint: function () {
                this.draw('Point');
            },
            drawRectangle: function () {
                this.draw('Rectangle');
            },
            drawCircle: function () {
                this.draw('Circle');
            },
            drawLineString: function () {
                this.draw('LineString');
            },
            drawPolygon: function () {
                this.draw('Polygon');
            },
            maybeUpdateDrawInteractionMode: function (mode) {
                this.resetPendingAnnotation();

                if (this.drawInteraction) {
                    this.map.removeInteraction(this.drawInteraction);
                    this.drawInteraction = undefined;
                }

                if (this.isDrawing && this.hasSelectedLabel) {
                    var shape = mode.slice(4); // Remove the 'draw' prefix.
                    this.pause();
                    this.drawInteraction = new ol.interaction.Draw({
                        source: this.pendingAnnotationSource,
                        type: shape,
                        style: biigle.$require('annotations.stores.styles').editing,
                    });
                    this.drawInteraction.on('drawend', this.extendPendingAnnotation);
                    this.map.addInteraction(this.drawInteraction);
                    this.pendingAnnotation.shape = shape;
                }
            },
            finishDrawAnnotation: function () {
                if (this.isDrawing) {
                    if (this.hasPendingAnnotation) {
                        this.$emit('create-annotation', this.pendingAnnotation);
                    }
                    this.resetInteractionMode();
                }
            },
            finishTrackAnnotation: function () {
                if (this.isDrawing) {
                    if (this.hasPendingAnnotation) {
                        this.$emit('track-annotation', this.pendingAnnotation);
                    }
                    this.resetInteractionMode();
                }
            },
            resetPendingAnnotation: function () {
                this.pendingAnnotationSource.clear();
                this.pendingAnnotation = {
                    shape: '',
                    frames: [],
                    points: [],
                };
            },
            extendPendingAnnotation: function (e) {
                var lastFrame = this.pendingAnnotation.frames[this.pendingAnnotation.frames.length - 1];

                if (lastFrame === undefined || lastFrame < this.video.currentTime) {
                    this.pendingAnnotation.frames.push(this.video.currentTime);
                    this.pendingAnnotation.points.push(this.getPointsFromGeometry(e.feature.getGeometry()));

                    if (!this.video.ended && this.autoplayDraw > 0) {
                        this.play();
                        window.clearTimeout(this.autoplayDrawTimeout);
                        this.autoplayDrawTimeout = window.setTimeout(this.pause, this.autoplayDraw * 1000);
                    }
                } else {
                    this.pendingAnnotationSource.once('addfeature', function (e) {
                        this.removeFeature(e.feature);
                    });
                }
            },
        },
        watch: {
            //
        },
        created: function () {
            this.$once('map-ready', this.initPendingAnnotationLayer);

            if (this.canAdd) {
                var kb = biigle.$require('keyboard');
                kb.on('a', this.drawPoint, 0, this.listenerSet);
                kb.on('s', this.drawRectangle, 0, this.listenerSet);
                kb.on('d', this.drawCircle, 0, this.listenerSet);
                kb.on('f', this.drawLineString, 0, this.listenerSet);
                kb.on('g', this.drawPolygon, 0, this.listenerSet);
                this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);
                kb.on('Enter', this.finishDrawAnnotation, 0, this.listenerSet);
            }
        },
    };
});
