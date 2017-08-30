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
        attachLabelInteraction,
        magicWandInteraction;

    // Map to detect which features were changed between modifystart and modifyend
    // events of the modify interaction.
    var featureRevisionMap = {};

    var imageLayer = new ol.layer.Image();
    var tiledImageLayer = new ol.layer.Tile();

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
            minimap: biigle.$require('annotations.components.minimap'),
            labelIndicator: biigle.$require('annotations.components.labelIndicator'),
            mousePositionIndicator: biigle.$require('annotations.components.mousePositionIndicator'),
            controlButton: biigle.$require('annotations.components.controlButton'),
            annotationTooltip: biigle.$require('annotations.components.annotationTooltip'),
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
            showMousePosition: {
                type: Boolean,
                default: false,
            },
            showAnnotationTooltip: {
                type: Boolean,
                default: false,
            },
            // Specifies whether the displayed image is cross origin.
            crossOrigin: {
                type: Boolean,
                default: false,
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
                // Index of the current image section in x and y direction.
                imageSection: [0, 0],
                // Actual center point of the current image section.
                imageSectionCenter: [0, 0],
                // Mouse position in image coordinates.
                mousePosition: [0, 0],
                // Mouse position in DOM element coordinates.
                mouseDomPosition: [0, 0],
                // Used to efficiently determine when to update hoveredAnnotations.
                hoveredAnnotationHash: '',
                hoveredAnnotations: [],
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    if (this.image.tiled === true) {
                        return [0, -this.image.height, this.image.width, 0];
                    }

                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 0, 0];
            },
            viewExtent: function () {
                // The view can't calculate the extent if the resolution is not set.
                if (this.resolution && map) {
                    return map.getView().calculateExtent(this.mapSize);
                }

                return [0, 0, 0, 0];
            },
            // Number of available image sections in x and y direction.
            imageSectionSteps: function () {
                return [
                    Math.ceil(this.extent[2] / (this.viewExtent[2] - this.viewExtent[0])),
                    Math.ceil(this.extent[3] / (this.viewExtent[3] - this.viewExtent[1])),
                ];
            },
            // Distance to travel between image sections in x and y direction.
            imageSectionStepSize: function () {
                var stepSize = [
                    this.viewExtent[2] - this.viewExtent[0],
                    this.viewExtent[3] - this.viewExtent[1],
                ];
                var overlap;
                if (this.imageSectionSteps[0] > 1) {
                    overlap = (stepSize[0] * this.imageSectionSteps[0]) - this.extent[2];
                    stepSize[0] -= overlap / (this.imageSectionSteps[0] - 1);
                } else {
                    stepSize[0] = this.viewExtent[2];
                }

                if (this.imageSectionSteps[1] > 1) {
                    overlap = (stepSize[1] * this.imageSectionSteps[1]) - this.extent[3];
                    stepSize[1] -= overlap / (this.imageSectionSteps[1] - 1);
                } else {
                    stepSize[1] = this.viewExtent[3];
                }

                return stepSize;
            },
            // Center position of the first image section [0, 0].
            imageSectionStartCenter: function () {
                var startCenter = [
                    (this.viewExtent[2] - this.viewExtent[0]) / 2,
                    (this.viewExtent[3] - this.viewExtent[1]) / 2,
                ];

                if (this.imageSectionSteps[0] <= 1) {
                    startCenter[0] = this.extent[2] / 2;
                }

                if (this.imageSectionSteps[1] <= 1) {
                    startCenter[1] = this.extent[3] / 2;
                }

                return startCenter;
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
            isDefaultInteractionMode: function () {
                return this.interactionMode === 'default';
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
            isMagicWanding: function () {
                return this.interactionMode === 'magicWand';
            },
            isAttaching: function () {
                return this.interactionMode === 'attach';
            },
            hasNoSelectedLabel: function () {
                return !this.selectedLabel;
            },
            hasSelectedAnnotations: function () {
                return this.selectedAnnotations.length > 0;
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
            isLawnmowerCycleMode: function () {
                return this.cycleMode === 'lawnmower';
            },
        },
        methods: {
            updateMapSize: function () {
                this.mapSize = map.getSize();
            },
            invertPointsYAxis: function (points) {
                // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
                // the points based on the type of the image that is currently displayed
                // (single or tiled). CAUTION: Modifies the array in place!
                //
                // If the image is tiled the y axis should be negated because the
                // coordinates of the OL Zoomify source are computed in a weird way.
                //
                // If it is a single image the y axis should be switched from "top to
                // bottom" to "bottom to top" or vice versa. Our database expects ttb,
                // OpenLayers expects btt.

                var height = this.image.tiled ? 0 : this.image.height;
                for (var i = 1; i < points.length; i += 2) {
                    points[i] = height - points[i];
                }

                return points;
            },
            convertPointsFromOlToDb: function (points) {
                // Merge the individual point arrays to a single array first.
                // [[x1, y1], [x2, y2]] -> [x1, y1, x2, y2]
                return this.invertPointsYAxis(Array.prototype.concat.apply([], points));
            },
            convertPointsFromDbToOl: function (points) {
                // Duplicate the points array because we don't want to modify the
                // original array.
                points = this.invertPointsYAxis(points.slice());
                var newPoints = [];
                for (var i = 0; i < points.length; i += 2) {
                    newPoints.push([
                        points[i],
                        // Circles have no fourth point so we take 0.
                        (points[i + 1] || 0)
                    ]);
                }

                return newPoints;
            },
            // Determines the OpenLayers geometry object for an annotation.
            getGeometry: function (annotation) {
                var points = this.convertPointsFromDbToOl(annotation.points);

                switch (annotation.shape) {
                    case 'Point':
                        return new ol.geom.Point(points[0]);
                    case 'Rectangle':
                        return new ol.geom.Rectangle([points]);
                    case 'Polygon':
                        return new ol.geom.Polygon([points]);
                    case 'LineString':
                        return new ol.geom.LineString(points);
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        return new ol.geom.Circle(points[0], points[1][0]);
                    // unsupported shapes are ignored
                    default:
                        console.error('Unknown annotation shape: ' + annotation.shape);
                        return;
                }
            },
            // Creates an OpenLayers feature object from an annotation.
            createFeature: function (annotation) {
                var feature = new ol.Feature(this.getGeometry(annotation));

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
                    if (fast) {
                        delete this.viewFitOptions.duration;
                    } else {
                        this.viewFitOptions.duration = 250;
                    }
                    map.getView().fit(feature.getGeometry(), this.viewFitOptions);
                }
            },
            fitImage: function () {
                map.getView().fit(this.extent, map.getSize());
            },
            extractAnnotationFromFeature: function (feature) {
                return feature.get('annotation');
            },
            handleFeatureSelect: function (event) {
                this.$emit('select',
                    event.selected.map(this.extractAnnotationFromFeature),
                    event.deselected.map(this.extractAnnotationFromFeature)
                );
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

                return this.convertPointsFromOlToDb(points);
            },
            handleNewFeature: function (e) {
                if (this.hasNoSelectedLabel) {
                    annotationSource.removeFeature(e.feature);
                } else {
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
                }
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
                } else {
                    this.interactionMode = 'attach';
                }
            },
            toggleMagicWand: function () {
                if (this.isMagicWanding) {
                    this.resetInteractionMode();
                } else if (magicWandInteraction) {
                    this.interactionMode = 'magicWand';
                }
            },
            handleAttachLabel: function (e) {
                this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
            },
            requireSelectedLabel: function () {
                biigle.$require('events').$emit('sidebar.open', 'labels');
                biigle.$require('messages.store').info('Please select a label first.');
                this.resetInteractionMode();
            },
            handleNewInteractionMode: function (mode) {
                if (drawInteraction) {
                    map.removeInteraction(drawInteraction);
                }
                selectInteraction.setActive(false);
                modifyInteraction.setActive(false);
                translateInteraction.setActive(false);
                attachLabelInteraction.setActive(false);
                if (magicWandInteraction) {
                    magicWandInteraction.setActive(false);
                }

                if (this.isDrawing) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else {
                        drawInteraction = new ol.interaction.Draw({
                            source: annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        map.addInteraction(drawInteraction);
                    }
                } else if (this.isAttaching) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else {
                        attachLabelInteraction.setActive(true);
                    }
                } else if (this.isMagicWanding) {
                    if (this.hasNoSelectedLabel) {
                        this.requireSelectedLabel();
                    } else if (magicWandInteraction) {
                        magicWandInteraction.setActive(true);
                    }
                } else {
                    switch (mode) {
                        case 'translate':
                            selectInteraction.setActive(true);
                            translateInteraction.setActive(true);
                            break;
                        default:
                            selectInteraction.setActive(true);
                            modifyInteraction.setActive(true);
                    }
                }

                if (this.showAnnotationTooltip) {
                    if (this.isDefaultInteractionMode) {
                        map.on('pointermove', this.updateHoveredAnnotations);
                        map.on('pointermove', this.updateMouseDomPosition);
                    } else {
                        map.un('pointermove', this.updateHoveredAnnotations);
                        map.un('pointermove', this.updateMouseDomPosition);
                        this.resetHoveredAnnotations();
                    }
                }
            },
            render: function () {
                if (map) {
                    map.render();
                }
            },
            // Calculate the center point of an image section based on its index in x and
            // y direction (e.g. [0, 0] for the first section).
            getImageSectionCenter: function (section) {
                return [
                    section[0] * this.imageSectionStepSize[0] + this.imageSectionStartCenter[0],
                    section[1] * this.imageSectionStepSize[1] + this.imageSectionStartCenter[1],
                ];
            },
            showImageSection: function (section) {
                if (section[0] < this.imageSectionSteps[0] && section[1] < this.imageSectionSteps[1] && section[0] >= 0 && section[1] >= 0) {
                    this.imageSection = section;
                    // Don't make imageSectionCenter a computed property because it
                    // would automatically update when the resolution changes. But we
                    // need the old value to compute the new image section in the
                    // resolution watcher first!
                    this.imageSectionCenter = this.getImageSectionCenter(section);
                    map.getView().setCenter(this.imageSectionCenter);
                    return true;
                }

                return false;
            },
            showLastImageSection: function () {
                this.showImageSection([
                    this.imageSectionSteps[0] - 1,
                    this.imageSectionSteps[1] - 1,
                ]);
            },
            showFirstImageSection: function () {
                this.showImageSection([0, 0]);
            },
            showPreviousImageSection: function () {
                var x = this.imageSection[0] - 1;
                if (x >= 0) {
                    return this.showImageSection([x, this.imageSection[1]]);
                } else {
                    return this.showImageSection([
                        this.imageSectionSteps[0] - 1,
                        this.imageSection[1] - 1,
                    ]);
                }
            },
            showNextImageSection: function () {
                var x = this.imageSection[0] + 1;
                if (x < this.imageSectionSteps[0]) {
                    return this.showImageSection([x, this.imageSection[1]]);
                } else {
                    return this.showImageSection([0, this.imageSection[1] + 1]);
                }
            },
            updateMouseDomPosition: function (e) {
                this.mouseDomPosition = e.pixel;
            },
            updateMousePosition: function (e) {
                var self = this;
                biigle.$require('annotations.stores.utils').throttle(function () {
                    self.mousePosition = self.invertPointsYAxis(e.coordinate).map(Math.round);
                }, 100, 'annotations.canvas.mouse-position');
            },
            updateHoveredAnnotations: function (e) {
                var annotations = [];
                map.forEachFeatureAtPixel(e.pixel, function (feature) {
                    annotations.push(feature.get('annotation'));
                }, {
                    layerFilter: function (layer) {
                        return layer === annotationLayer;
                    }
                });

                var hash = annotations.map(function (a) {return a.id;}).sort().join('');

                if (this.hoveredAnnotationHash !== hash) {
                    this.hoveredAnnotationHash = hash;
                    this.hoveredAnnotations = annotations;
                }
            },
            resetHoveredAnnotations: function () {
                this.hoveredAnnotationHash = '';
                this.hoveredAnnotations = [];
            },
            handleRegularImage: function (image, oldImage) {
                if (!image) {
                    imageLayer.setSource(null);
                } else {
                    if (!oldImage || oldImage.width !== image.width || oldImage.height !== image.height) {
                        // image.canvas points to the same object for all images for
                        // performance reasons. Because of this we only have to update
                        // the source if the image dimensions have changed. The content
                        // of the canvas element will be automatically updated.
                        imageLayer.setSource(new ol.source.Canvas({
                            canvas: image.canvas,
                            projection: this.projection,
                            canvasExtent: this.extent,
                            canvasSize: [image.width, image.height]
                        }));
                    }

                    // The same performance optimizations mentioned above make the magic
                    // wand interaction unable to detect any change if the image is
                    // switched. So if the interaction is currently active we have to
                    // update it manually here.
                    if (this.isMagicWanding) {
                        magicWandInteraction.updateSnapshot();
                    }
                }
            },
            handleTiledImage: function (image, oldImage) {
                if (!image) {
                    tiledImageLayer.setSource(null);
                } else {
                    tiledImageLayer.setSource(new ol.source.Zoomify({
                        url: image.url,
                        size: [image.width, image.height],
                    }));
                }
            },
        },
        watch: {
            image: function (image, oldImage) {
                if (image.tiled === true) {
                    if (!oldImage || oldImage.tiled !== true) {
                        map.removeLayer(imageLayer);
                        map.addLayer(tiledImageLayer);
                    }

                    this.handleTiledImage(image, oldImage);
                } else {
                    if (!oldImage || oldImage.tiled === true) {
                        map.removeLayer(tiledImageLayer);
                        map.addLayer(imageLayer);
                    }

                    this.handleRegularImage(image, oldImage);
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
                this.resetHoveredAnnotations();
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

                // Leave this undefined if the current image is not tiled.
                var resolutions;

                if (this.image.tiled === true) {
                    resolutions = tiledImageLayer.getSource().getTileGrid().getResolutions();
                }

                map.setView(new ol.View({
                    projection: this.projection,
                    center: center,
                    resolution: this.resolution,
                    resolutions: resolutions,
                    zoomFactor: 1.5,
                    // allow a maximum of 4x magnification
                    minResolution: 0.25,
                    // restrict movement
                    extent: extent
                }));

                if (this.resolution === undefined) {
                    map.getView().fit(extent);
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
            // Update the current image section if either the resolution or the map size
            // changed. viewExtent depends on both so we can use it as watcher.
            viewExtent: function () {
                if (!this.isLawnmowerCycleMode || !Number.isInteger(this.imageSectionSteps[0]) || !Number.isInteger(this.imageSectionSteps[1])) {
                    return;
                }
                var distance = function (p1, p2) {
                    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                };

                var nearest = Infinity;
                var current = 0;
                var nearestStep = [0, 0];
                for (var y = 0; y < this.imageSectionSteps[1]; y++) {
                    for (var x = 0; x < this.imageSectionSteps[0]; x++) {
                        current = distance(this.imageSectionCenter, this.getImageSectionCenter([x, y]));
                        if (current < nearest) {
                            nearestStep[0] = x;
                            nearestStep[1] = y;
                            nearest = current;
                        }
                    }
                }

                this.showImageSection(nearestStep);
            },
            showMousePosition: function (show) {
                if (show) {
                    map.on('pointermove', this.updateMousePosition);
                } else {
                    map.un('pointermove', this.updateMousePosition);
                }
            },
            showAnnotationTooltip: function (show) {
                if (show) {
                    map.on('pointermove', this.updateMouseDomPosition);
                    map.on('pointermove', this.updateHoveredAnnotations);
                } else {
                    map.un('pointermove', this.updateMouseDomPosition);
                    map.un('pointermove', this.updateHoveredAnnotations);
                    this.resetHoveredAnnotations();
                }
            },
        },
        created: function () {
            var self = this;
            styles = biigle.$require('annotations.stores.styles');
            map = biigle.$require('annotations.stores.map');

            annotationLayer.setStyle(styles.features);
            map.addLayer(annotationLayer);

            biigle.$require('events').$on('sidebar.toggle', function () {
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

            var keyboard = biigle.$require('keyboard');
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

                if (!this.crossOrigin) {
                    var MagicWandInteraction = biigle.$require('annotations.ol.MagicWandInteraction');
                    magicWandInteraction = new MagicWandInteraction({
                        map: map,
                        layer: imageLayer,
                        source: annotationSource,
                        style: styles.editing,
                        indicatorPointStyle: styles.editing,
                        indicatorCrossStyle: styles.cross,
                        simplifyTolerant: 0.1,
                    });
                    magicWandInteraction.on('drawend', this.handleNewFeature);
                    magicWandInteraction.setActive(false);
                    map.addInteraction(magicWandInteraction);
                }

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
