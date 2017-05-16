/**
 * The annotator canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas', function () {
    // Don't create these as reactive Vue properties because they should work as fast as
    // possible.
    var map,
        styles,
        selectInteraction,
        drawInteraction,
        modifyInteraction,
        translateInteraction,
        attachLabelInteraction;

    // Map to detect which features were changed between modifystart and modifyend
    // events of the modify interaction.
    var featureRevisionMap = {};

    var imageLayer = new ol.layer.Image();
    var annotationFeatures = new ol.Collection();
    var annotationSource = new ol.source.Vector({
        features: annotationFeatures
    });
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
            editable: {
                type: Boolean,
                default: false,
            },
            image: {
                type: Object,
                default: null,
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
            lastCreatedAnnotation: {
                default: null,
            },
            annotationOpacity: {
                type: Number,
                default: 1,
            },
            cycleMode: {
                type: String,
                default: 'default',
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
                // There are several interaction modes like 'drawPoint', 'attach' or
                // 'translate' etc. For each mode the allowed/active OpenLayers map
                // interactions are different.
                interactionMode: 'default',
                // Size of the OpenLayers map in px.
                mapSize: [0, 0],
                // The image section information is needed for the lawnmower cycling mode
                imageSection: {
                    // Index of the current image section in x and y direction.
                    current: [0, 0],
                    // View center point of the first image section.
                    startCenter: [0, 0],
                    // Number of pixels to proceed in x or y direction for each step.
                    stepSize: [0, 0],
                    // Number of available steps in x and y direction.
                    stepCount: [0, 0],
                },
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 1, 1];
            },
            viewExtent: function () {
                // The view can't calculate the extent if the resolution is not set.
                if (this.resolution && map) {
                    return map.getView().calculateExtent(this.mapSize);
                }

                return [0, 0, 1, 1];
            },
            imageSectionSteps: function () {
                // TODO continue here. This replaces the imageSection.stepCount.
                return [
                    Math.ceil(this.extent[2] / (this.viewExtent[2] - this.viewExtent[0])),
                    Math.ceil(this.extent[3] / (this.viewExtent[3] - this.viewExtent[1])),
                ];
            },
            projection: function () {
                return new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent
                });
            },
            selectedFeatures: function () {
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
            isTranslating: function () {
                return this.interactionMode === 'translate';
            },
            hasNoSelectedLabel: function () {
                return !this.selectedLabel;
            },
            hasSelectedAnnotations: function () {
                return this.selectedAnnotations.length > 0;
            },
            isAttaching: function () {
                return this.interactionMode === 'attach';
            },
            hasLastCreatedAnnotation: function () {
                return this.lastCreatedAnnotation !== null;
            },
            previousButtonTitle: function () {
                switch (this.cycleMode) {
                    case 'volare':
                        return 'Previous annotation';
                    case 'lawnmower':
                        return 'Previous image section';
                    default:
                        return 'Previous image';
                }
            },
            nextButtonTitle: function () {
                switch (this.cycleMode) {
                    case 'volare':
                        return 'Next annotation';
                    case 'lawnmower':
                        return 'Next image section';
                    default:
                        return 'Next image';
                }
            },
        },
        methods: {
            updateMapSize: function () {
                this.mapSize = map.getSize();
            },
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

                return feature;
            },
            handleFeatureModifyStart: function (e) {
                e.features.forEach(function (feature) {
                    featureRevisionMap[feature.getId()] = feature.getRevision();
                });
            },
            handleFeatureModifyEnd: function (e) {
                var self = this;
                var annotations = e.features.getArray()
                    .filter(function (feature) {
                        return featureRevisionMap[feature.getId()] !== feature.getRevision();
                    })
                    .map(function (feature) {
                        return {
                            id: feature.getId(),
                            image_id: feature.get('annotation').image_id,
                            points: self.getPoints(feature.getGeometry()),
                        };
                    });

                if (annotations.length > 0) {
                    this.$emit('update', annotations);
                }
            },
            focusAnnotation: function (annotation, fast) {
                var feature = annotationSource.getFeatureById(annotation.id);
                if (feature) {
                    var view = map.getView();
                    if (!fast) {
                        // animate fit
                        var pan = ol.animation.pan({
                            source: view.getCenter()
                        });
                        var zoom = ol.animation.zoom({
                            resolution: view.getResolution()
                        });
                        map.beforeRender(pan, zoom);
                    }
                    view.fit(feature.getGeometry(), map.getSize(), this.viewFitOptions);
                }
            },
            fitImage: function () {
                map.getView().fit(this.extent, map.getSize());
            },
            extractAnnotationFromFeature: function (feature) {
                return feature.get('annotation');
            },
            handleFeatureSelect: function (event) {
                this.$emit('select', event.selected.map(this.extractAnnotationFromFeature), event.deselected.map(this.extractAnnotationFromFeature));
            },
            handlePrevious: function () {
                this.$emit('previous');
            },
            handleNext: function () {
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
            deleteSelectedAnnotations: function () {
                if (this.hasSelectedAnnotations && confirm('Are you sure you want to delete all selected annotations?')) {
                    this.$emit('delete', this.selectedAnnotations);
                }
            },
            deleteLastCreatedAnnotation: function () {
                if (this.hasLastCreatedAnnotation) {
                    this.$emit('delete', [this.lastCreatedAnnotation]);
                }
            },
            toggleTranslating: function () {
                if (this.isTranslating) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'translate';
                }
            },
            toggleAttaching: function () {
                if (this.isAttaching) {
                    this.resetInteractionMode();
                } else if (!this.hasNoSelectedLabel) {
                    this.interactionMode = 'attach';
                }
            },
            handleAttachLabel: function (e) {
                this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
            },
            handleNewInteractionMode: function (mode) {
                if (drawInteraction) {
                    map.removeInteraction(drawInteraction);
                }

                if (this.isDrawing) {
                    if (this.hasNoSelectedLabel) {
                        biigle.$require('biigle.events').$emit('sidebar.open', 'labels');
                        biigle.$require('messages.store').info('Please select a label first.');
                        this.resetInteractionMode();
                    } else {
                        selectInteraction.setActive(false);
                        modifyInteraction.setActive(false);
                        translateInteraction.setActive(false);
                        attachLabelInteraction.setActive(false);
                        drawInteraction = new ol.interaction.Draw({
                            source: annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        map.addInteraction(drawInteraction);
                    }
                } else {
                    switch (mode) {
                        case 'translate':
                            selectInteraction.setActive(true);
                            modifyInteraction.setActive(false);
                            translateInteraction.setActive(true);
                            attachLabelInteraction.setActive(false);
                            break;
                        case 'attach':
                            selectInteraction.setActive(false);
                            modifyInteraction.setActive(false);
                            translateInteraction.setActive(false);
                            attachLabelInteraction.setActive(true);
                            break;
                        default:
                            selectInteraction.setActive(true);
                            modifyInteraction.setActive(true);
                            translateInteraction.setActive(false);
                            attachLabelInteraction.setActive(false);
                    }
                }
            },
            render: function () {
                if (map) {
                    map.render();
                }
            },
            showLastImageSection: function () {

            },
            showFirstImageSection: function () {

            },
            showPreviousImageSection: function () {

            },
            showNextImageSection: function () {

            },
        },
        watch: {
            imageSectionSteps: function (s) {
                console.log(s);
            },
            image: function (image, oldImage) {
                // image.canvas points to the same object for all images for performance
                // reasons. Because of this we only have to update the source if the
                // image dimensions have changed. The content of the canvas element will
                // be automatically updated.
                if (!oldImage || oldImage.width !== image.width || oldImage.height !== image.height) {
                    imageLayer.setSource(new ol.source.Canvas({
                        canvas: image.canvas,
                        projection: this.projection,
                        canvasExtent: this.extent,
                        canvasSize: [image.width, image.height]
                    }));
                }
            },
            annotations: function (annotations) {
                var annotationsMap = {};
                annotations.forEach(function (annotation) {
                    annotationsMap[annotation.id] = null;
                });

                var oldFeaturesMap = {};
                var oldFeatures = annotationSource.getFeatures();
                var removedFeatures = oldFeatures.filter(function (feature) {
                    oldFeaturesMap[feature.getId()] = null;
                    return !annotationsMap.hasOwnProperty(feature.getId());
                });

                if (removedFeatures.length === oldFeatures.length) {
                    // In case we switched the images, we want to clear and redraw all
                    // features.
                    annotationSource.clear(true);
                } else {
                    // In case annotations were added/removed, we only want to update the
                    // changed features.
                    removedFeatures.forEach(function (feature) {
                        annotationSource.removeFeature(feature);
                    });

                    annotations = annotations.filter(function (annotation) {
                        return !oldFeaturesMap.hasOwnProperty(annotation.id);
                    });
                }

                annotationSource.addFeatures(annotations.map(this.createFeature));
            },
            selectedAnnotations: function (annotations) {
                var source = annotationSource;
                var features = this.selectedFeatures;
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
            selectedLabel: function (label) {
                if (!label) {
                    if (this.isDrawing || this.isAttaching) {
                        this.resetInteractionMode();
                    }
                }
            },
            annotationOpacity: function (opacity) {
                annotationLayer.setOpacity(opacity);
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

            map.on('change:size', this.updateMapSize);

            // We initialize this here because we need to make sure the styles are
            // properly loaded and there is no setStyle() function like for the
            // annotationLayer.
            selectInteraction = new ol.interaction.Select({
                style: styles.highlight,
                layers: [annotationLayer],
                // enable selecting multiple overlapping features at once
                multi: true
            });

            selectInteraction.on('select', this.handleFeatureSelect);
            map.addInteraction(selectInteraction);

            var keyboard = biigle.$require('labelTrees.stores.keyboard');
            // Space bar.
            keyboard.on(32, this.handleNext);
            // Arrow right key.
            keyboard.on(39, this.handleNext);
            // Arrow left key.
            keyboard.on(37, this.handlePrevious);
            // Esc key.
            keyboard.on(27, this.resetInteractionMode);

            if (this.editable) {
                modifyInteraction = new ol.interaction.Modify({
                    features: selectInteraction.getFeatures(),
                    // She Shift key must be pressed to delete vertices, so that new
                    // vertices can be drawn at the same position of existing vertices.
                    deleteCondition: function(event) {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    },
                });
                modifyInteraction.on('modifystart', this.handleFeatureModifyStart);
                modifyInteraction.on('modifyend', this.handleFeatureModifyEnd);
                map.addInteraction(modifyInteraction);

                var ExtendedTranslateInteraction = biigle.$require('annotations.ol.ExtendedTranslateInteraction');
                translateInteraction = new ExtendedTranslateInteraction({
                    features: selectInteraction.getFeatures(),
                    map: map,
                });
                translateInteraction.setActive(false);
                translateInteraction.on('translatestart', this.handleFeatureModifyStart);
                translateInteraction.on('translateend', this.handleFeatureModifyEnd);
                map.addInteraction(translateInteraction);

                var AttachLabelInteraction = biigle.$require('annotations.ol.AttachLabelInteraction');
                attachLabelInteraction = new AttachLabelInteraction({
                    features: annotationFeatures,
                    map: map,
                });
                attachLabelInteraction.setActive(false);
                attachLabelInteraction.on('attach', this.handleAttachLabel);
                map.addInteraction(attachLabelInteraction);

                // Del key.
                keyboard.on(46, this.deleteSelectedAnnotations);
                // Backspace key.
                keyboard.on(8, this.deleteLastCreatedAnnotation);

                keyboard.on('a', this.drawPoint);
                keyboard.on('s', this.drawRectangle);
                keyboard.on('d', this.drawCircle);
                keyboard.on('f', this.drawLineString);
                keyboard.on('g', this.drawPolygon);
                keyboard.on('m', this.toggleTranslating);
                keyboard.on('l', this.toggleAttaching);

                this.$watch('interactionMode', this.handleNewInteractionMode);
            }
        },
        mounted: function () {
            map.setTarget(this.$el);
        },
    };
});
