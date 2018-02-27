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
    // The name can be used for layer filters, e.g. with forEachFeatureAtPixel.
    annotationLayer.set('name', 'annotations');

    return {
        mixins: [
            // Since this component got quite huge some logic is outsourced to these
            // mixins.
            biigle.$require('annotations.components.annotationCanvas.lawnmower'),
            biigle.$require('annotations.components.annotationCanvas.mousePosition'),
            biigle.$require('annotations.components.annotationCanvas.zoomLevel'),
            biigle.$require('annotations.components.annotationCanvas.annotationTooltip'),
            biigle.$require('annotations.components.annotationCanvas.sampling'),
        ],
        components: {
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
            annotationMode: {
                type: String,
                default: 'default',
            },
            showMinimap: {
                type: Boolean,
                default: true,
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
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 0, 0];
            },
            viewExtent: function () {
                // The view can't calculate the extent if the resolution is not set.
                // Also use this.initialized so this property is recomputed when the
                // map is set (because the map is no reactive object). See:
                // https://github.com/BiodataMiningGroup/biigle-annotations/issues/69
                if (this.initialized && this.resolution && map) {
                    return map.getView().calculateExtent(this.mapSize);
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
            isDrawingEllipse: function () {
                return this.interactionMode === 'drawEllipse';
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
            hasSelectedLabel: function () {
                return Boolean(this.selectedLabel);
            },
            hasSelectedAnnotations: function () {
                return this.selectedAnnotations.length > 0;
            },
            hasLastCreatedAnnotation: function () {
                return this.lastCreatedAnnotation !== null;
            },
            previousButtonTitle: function () {
                switch (this.annotationMode) {
                    case 'volare':
                        return 'Previous annotation';
                    case 'lawnmower':
                        return 'Previous image section';
                    case 'randomSampling':
                    case 'regularSampling':
                        return 'Previous sample location';
                    default:
                        return 'Previous image';
                }
            },
            nextButtonTitle: function () {
                switch (this.annotationMode) {
                    case 'volare':
                        return 'Next annotation';
                    case 'lawnmower':
                        return 'Next image section';
                    case 'randomSampling':
                    case 'regularSampling':
                        return 'Next sample location';
                    default:
                        return 'Next image';
                }
            },
        },
        methods: {
            updateMapSize: function () {
                this.mapSize = map.getSize();
            },
            updateMapView: function (e) {
                var view = e.target.getView();
                this.$emit('moveend', {
                    center: view.getCenter(),
                    resolution: view.getResolution(),
                });
            },
            invertPointsYAxis: function (points) {
                // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
                // the points. CAUTION: Modifies the array in place!
                // The y axis should be switched from "top to bottom" to "bottom to top"
                // or vice versa. Our database expects ttb, OpenLayers expects btt.

                var height = this.extent[3];
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
                    case 'Ellipse':
                        return new ol.geom.Ellipse([points]);
                    default:
                        // unsupported shapes are ignored
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
            drawEllipse: function () {
                this.draw('Ellipse');
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
                    case 'Ellipse':
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
                if (this.hasSelectedLabel) {
                    var geometry = e.feature.getGeometry();
                    e.feature.set('color', this.selectedLabel.color);

                    // This callback is called when saving the annotation succeeded or
                    // failed, to remove the temporary feature.
                    var removeCallback = function () {
                        try {
                            annotationSource.removeFeature(e.feature);
                        } catch (e) {
                            // If this failed, the feature was already removed.
                            // Do nothing in this case.
                        }
                    };

                    this.$emit('new', {
                        shape: geometry.getType(),
                        points: this.getPoints(geometry),
                    }, removeCallback);
                } else {
                    annotationSource.removeFeature(e.feature);
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
            createPointAnnotationAt: function (x, y) {
                if (this.hasSelectedLabel) {
                    var feature = new ol.Feature(new ol.geom.Point([x, y]));
                    // Simulare a feature created event so we can reuse the apropriate
                    // function.
                    annotationSource.addFeature(feature);
                    this.handleNewFeature({feature: feature});
                } else {
                    this.requireSelectedLabel();
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
                    if (this.hasSelectedLabel) {
                        drawInteraction = new ol.interaction.Draw({
                            source: annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        map.addInteraction(drawInteraction);
                    } else {
                        this.requireSelectedLabel();
                    }
                } else if (this.isAttaching) {
                    if (this.hasSelectedLabel) {
                        attachLabelInteraction.setActive(true);
                    } else {
                        this.requireSelectedLabel();
                    }
                } else if (this.isMagicWanding) {
                    if (!this.hasSelectedLabel) {
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
                        // Set the extent like this instead of default so static images
                        // and tiled images can be treated the same.
                        extent: [0, 0, image.width, image.height],
                        transition: 100,
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
                        if (magicWandInteraction) {
                            magicWandInteraction.setLayer(tiledImageLayer);
                        }
                    }

                    this.handleTiledImage(image, oldImage);
                } else {
                    if (!oldImage || oldImage.tiled === true) {
                        map.removeLayer(tiledImageLayer);
                        map.addLayer(imageLayer);
                        if (magicWandInteraction) {
                            magicWandInteraction.setLayer(imageLayer);
                        }
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
                    // changed features. But don't remove the temporary annotations with
                    // undefined ID here. These will be removed asynchronously through
                    // their removeCallback when they were saved (or failed to be).
                    // see: https://github.com/BiodataMiningGroup/biigle-annotations/issues/82
                    removedFeatures.filter(function (feature) {
                            return feature.getId() !== undefined;
                        }).forEach(function (feature) {
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
                // extent[0] and extent[1] are always 0.
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
                    zoomFactor: 2,
                    // Allow a maximum of 4x magnification for non-tiled images.
                    minResolution: 0.25,
                    // Restrict movement.
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

            map.on('change:size', this.updateMapSize);
            map.on('moveend', this.updateMapView);

            // We initialize this here because we need to make sure the styles are
            // properly loaded and there is no setStyle() function like for the
            // annotationLayer.
            selectInteraction = new ol.interaction.Select({
                // Use click instead of default singleclick because the latter is delayed
                // 250ms to ensure the event is no doubleclick. But we want it to be as
                // fast as possible.
                condition: ol.events.condition.click,
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

                if (this.crossOrigin) {
                    keyboard.on('g', this.drawPolygon);
                } else {
                    // Magic wand interaction is not available for remote images.
                    var MagicWandInteraction = biigle.$require('annotations.ol.MagicWandInteraction');
                    magicWandInteraction = new MagicWandInteraction({
                        map: map,
                        source: annotationSource,
                        style: styles.editing,
                        indicatorPointStyle: styles.editing,
                        indicatorCrossStyle: styles.cross,
                        simplifyTolerant: 0.1,
                    });
                    magicWandInteraction.on('drawend', this.handleNewFeature);
                    magicWandInteraction.setActive(false);
                    map.addInteraction(magicWandInteraction);

                    keyboard.on('g', function (e) {
                        if (e.shiftKey) {
                            self.toggleMagicWand();
                        } else {
                            self.drawPolygon();
                        }
                    });
                }

                // Del key.
                keyboard.on(46, this.deleteSelectedAnnotations);
                // Backspace key.
                keyboard.on(8, this.deleteLastCreatedAnnotation);

                keyboard.on('a', this.drawPoint);
                keyboard.on('s', this.drawRectangle);
                keyboard.on('d', function (e) {
                    if (e.shiftKey) {
                        self.drawEllipse();
                    } else {
                        self.drawCircle();
                    }
                });
                keyboard.on('f', this.drawLineString);
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
