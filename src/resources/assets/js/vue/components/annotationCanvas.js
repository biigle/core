/**
 * The annotator canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas', function () {
    // Don't create these as reactive Vue properties because they should work as fast as
    // possible.
    var map, styles, selectInteraction, drawInteraction;
    var imageLayer = new ol.layer.Image();

    var annotationSource = new ol.source.Vector();
    var annotationLayer = new ol.layer.Vector({
        source: annotationSource,
        zIndex: 100,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
    });

    return {
        components: {
            loaderBlock: biigle.$require('core.components.loaderBlock'),
            minimap: biigle.$require('annotations.components.minimap'),
            labelIndicator: biigle.$require('annotations.components.labelIndicator'),
            controlButton: biigle.$require('annotations.components.controlButton'),
        },
        props: {
            image: {
                type: HTMLCanvasElement,
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
            loading: {
                type: Boolean,
                default: false,
            },
            center: {
                type: Array,
                default: undefined,
            },
            resolution: {
                type: Number,
                default: undefined,
            },
            selectedLabel: {
                default: null,
            },
        },
        data: function () {
            var styles = biigle.$require('annotations.stores.styles');

            return {
                initialized: false,
                // Options to use for the view.fit function.
                viewFitOptions: {
                    padding: [50, 50, 50, 50],
                    minResolution: 1,
                },
                // There are several interaction modes like 'drawingPoint',
                // 'attachingLabels' or 'movingAnnotations' etc. For each mode the
                // allowed/active OpenLayers map interactions are different.
                interactionMode: 'default',
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 0, 0];
            },
            projection: function () {
                return new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent
                });
            },
            selectFeatures: function () {
                return selectInteraction ? selectInteraction.getFeatures() : [];
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
            hasNoSelectedLabel: function () {
                return !this.selectedLabel;
            },
            hasSelectedAnnotations: function () {
                return this.selectedAnnotations.length > 0;
            },
        },
        methods: {
            // Determines the OpenLayers geometry object for an annotation.
            getGeometry: function (annotation) {
                var points = annotation.points;
                var newPoints = [];
                var height = this.image.height;
                for (var i = 0; i < points.length; i += 2) {
                    newPoints.push([
                        points[i],
                        // Invert the y axis to OpenLayers coordinates.
                        // Circles have no fourth point so we take 0.
                        height - (points[i + 1] || 0)
                    ]);
                }

                switch (annotation.shape) {
                    case 'Point':
                        return new ol.geom.Point(newPoints[0]);
                    case 'Rectangle':
                        return new ol.geom.Rectangle([newPoints]);
                    case 'Polygon':
                        return new ol.geom.Polygon([newPoints]);
                    case 'LineString':
                        return new ol.geom.LineString(newPoints);
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        return new ol.geom.Circle(newPoints[0], newPoints[1][0]);
                    // unsupported shapes are ignored
                    default:
                        console.error('Unknown annotation shape: ' + annotation.shape);
                        return;
                }
            },
            // Creates an OpenLayers feature object from an annotation.
            createFeature: function (annotation) {
                var feature = new ol.Feature({
                    geometry: this.getGeometry(annotation),
                });

                feature.setId(annotation.id);
                feature.set('annotation', annotation);
                if (annotation.labels && annotation.labels.length > 0) {
                    feature.set('color', annotation.labels[0].label.color);
                }
                // TODO
                // feature.on('change', handleGeometryChange);

                return feature;
            },
            focusAnnotation: function (annotation) {
                var feature = annotationSource.getFeatureById(annotation.id);
                if (feature) {
                    // animate fit
                    var view = map.getView();
                    var pan = ol.animation.pan({
                        source: view.getCenter()
                    });
                    var zoom = ol.animation.zoom({
                        resolution: view.getResolution()
                    });
                    map.beforeRender(pan, zoom);
                    view.fit(feature.getGeometry(), map.getSize(), this.viewFitOptions);
                }
            },
            handleFeatureSelect: function (event) {
                var extractAnnotation = function (feature) {
                    return feature.get('annotation');
                };
                this.$emit('select', event.selected.map(extractAnnotation), event.deselected.map(extractAnnotation));
            },
            handlePreviousImage: function () {
                this.$emit('previous');
            },
            handleNextImage: function () {
                this.$emit('next');
            },
            resetInteractionMode: function () {
                this.interactionMode = 'default';
            },
            draw: function (name) {
                if (this['isDrawing' + name]) {
                    this.resetInteractionMode();
                } else {
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
            // Assembles the points array depending on the OpenLayers geometry type.
            getPoints: function (geometry) {
                var points;
                switch (geometry.getType()) {
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        points = [geometry.getCenter(), [geometry.getRadius()]];
                        break;
                    case 'Polygon':
                    case 'Rectangle':
                        points = geometry.getCoordinates()[0];
                        break;
                    case 'Point':
                        points = [geometry.getCoordinates()];
                        break;
                    default:
                        points = geometry.getCoordinates();
                }

                // Merge the individual point arrays to a single array.
                points = Array.prototype.concat.apply([], points);

                // Invert y coordinates back to the format that is stored in the DB.
                var height = this.image.height;
                for (var i = 1; i < points.length; i += 2) {
                    points[i] = height - points[i];
                }

                return points;
            },
            handleNewFeature: function (e) {
                var geometry = e.feature.getGeometry();
                e.feature.set('color', this.selectedLabel.color);

                // This callback is called in case saving the annotation failed.
                // If saving the annotation succeeded, the temporary feature will
                // be removed during the reactive update of the annotations property.
                var removeCallback = function () {
                    annotationSource.removeFeature(e.feature);
                };

                this.$emit('new', {
                    shape: geometry.getType(),
                    points: this.getPoints(geometry),
                }, removeCallback);
            },
            emitDelete: function () {
                if (this.hasSelectedAnnotations && confirm('Are you sure you want to delete all selected annotations?')) {
                    this.$emit('delete', this.selectedAnnotations);
                }
            },
        },
        watch: {
            image: function (image) {
                imageLayer.setSource(new ol.source.Canvas({
                    canvas: image,
                    projection: this.projection,
                    canvasExtent: this.extent,
                    canvasSize: [image.width, image.height]
                }));
            },
            annotations: function (annotations) {
                // TODO: Maybe optimize to only remove and draw features that were
                // changed. Only call clear if too many were removed.
                annotationSource.clear(true);
                annotationSource.addFeatures(this.annotations.map(this.createFeature));
            },
            selectedAnnotations: function (annotations) {
                var source = annotationSource;
                var features = this.selectFeatures;
                features.clear();
                annotations.forEach(function (annotation) {
                    features.push(source.getFeatureById(annotation.id));
                });
            },
            extent: function (extent, oldExtent) {
                // The extent only truly changes if the width and height changed.
                if (extent[2] === oldExtent[2] && extent[3] === oldExtent[3]) {
                    return;
                }

                var center = ol.extent.getCenter(extent);

                // Only use this.center once on initialization. If the extent changes
                // afterwards, the center should be reset.
                if (!this.initialized) {
                    center = this.center || center;
                    this.initialized = true;
                }

                map.setView(new ol.View({
                    projection: this.projection,
                    center: center,
                    resolution: this.resolution,
                    zoomFactor: 1.5,
                    // allow a maximum of 4x magnification
                    minResolution: 0.25,
                    // restrict movement
                    extent: extent
                }));

                if (this.resolution === undefined) {
                    map.getView().fit(extent, map.getSize());
                }
            },
            interactionMode: function (mode) {
                if (drawInteraction) {
                    map.removeInteraction(drawInteraction);
                }

                // TODO: de-/activate map interactions here
                if (this.isDrawing) {
                    if (this.hasNoSelectedLabel) {
                        biigle.$require('biigle.events').$emit('sidebar.open', 'labels');
                        biigle.$require('messages.store').info('Please select a label first.');
                        this.resetInteractionMode();
                    } else {
                        selectInteraction.setActive(false);
                        drawInteraction = new ol.interaction.Draw({
                            source: annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        map.addInteraction(drawInteraction);
                    }
                } else {
                    selectInteraction.setActive(true);
                }
            },
            selectedLabel: function (label) {
                if (!label && this.interactionMode.startsWith('draw')) {
                    this.resetInteractionMode();
                }
            },
        },
        created: function () {
            var self = this;
            styles = biigle.$require('annotations.stores.styles');
            map = biigle.$require('annotations.stores.map');

            map.addLayer(imageLayer);

            annotationLayer.setStyle(styles.features);
            map.addLayer(annotationLayer);

            biigle.$require('biigle.events').$on('sidebar.toggle', function () {
                self.$nextTick(function () {
                    map.updateSize();
                });
            });

            map.on('moveend', function (e) {
                var view = map.getView();
                self.$emit('moveend', {
                    center: view.getCenter(),
                    resolution: view.getResolution(),
                });
            });

            // We initialize this here because we need to make sure the styles are
            // properly loaded and there is no setStyle() function like for the
            // annotationLayer.
            selectInteraction = new ol.interaction.Select({
                style: styles.highlight,
                layers: [annotationLayer],
                // enable selecting multiple overlapping features at once
                multi: true
            });

            map.addInteraction(selectInteraction);
            selectInteraction.on('select', this.handleFeatureSelect);

            var keyboard = biigle.$require('labelTrees.stores.keyboard');
            // Space bar.
            keyboard.on(32, this.handleNextImage);
            // Arrow right key.
            keyboard.on(39, this.handleNextImage);
            // Arrow left key.
            keyboard.on(37, this.handlePreviousImage);
            // Esc key.
            keyboard.on(27, this.resetInteractionMode);

            keyboard.on('a', this.drawPoint);
            keyboard.on('s', this.drawRectangle);
            keyboard.on('d', this.drawCircle);
            keyboard.on('f', this.drawLineString);
            keyboard.on('g', this.drawPolygon);

            // Del key.
            keyboard.on(46, this.emitDelete);
        },
        mounted: function () {
            map.setTarget(this.$el);
        },
    };
});
