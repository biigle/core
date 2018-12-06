/**
 * The annotator canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas', {
    mixins: [
        // Since this component got quite huge some logic is outsourced to these mixins.
        biigle.$require('annotations.components.annotationCanvas.drawInteractions'),
        biigle.$require('annotations.components.annotationCanvas.magicWandInteraction'),
        biigle.$require('annotations.components.annotationCanvas.translateInteraction'),
        biigle.$require('annotations.components.annotationCanvas.attachLabelInteraction'),
        biigle.$require('annotations.components.annotationCanvas.measureInteraction'),
        biigle.$require('annotations.components.annotationCanvas.lawnmower'),
        biigle.$require('annotations.components.annotationCanvas.mousePosition'),
        biigle.$require('annotations.components.annotationCanvas.zoomLevel'),
        biigle.$require('annotations.components.annotationCanvas.annotationTooltip'),
        biigle.$require('annotations.components.annotationCanvas.sampling'),
        biigle.$require('annotations.components.annotationCanvas.scaleLine'),
    ],
    components: {
        minimap: biigle.$require('annotations.components.minimap'),
        labelIndicator: biigle.$require('annotations.components.labelIndicator'),
        controlButton: biigle.$require('annotations.components.controlButton'),
    },
    props: {
        canAdd: {
            type: Boolean,
            default: false,
        },
        canModify: {
            type: Boolean,
            default: false,
        },
        canDelete: {
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
        listenerSet: {
            type: String,
            default: 'default',
        },
    },
    data: function () {
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
            // Mouse position in OpenLayers coordinates.
            mousePosition: [0, 0],
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
            // https://github.com/biigle/annotations/issues/69
            if (this.initialized && this.resolution && this.map) {
                return this.map.getView().calculateExtent(this.mapSize);
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
            return this.selectInteraction ? this.selectInteraction.getFeatures() : [];
        },
        isDefaultInteractionMode: function () {
            return this.interactionMode === 'default';
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
        createMap: function () {
            var map = new ol.Map({
                renderer: 'canvas',
                controls: [
                    new ol.control.Zoom(),
                    new ol.control.ZoomToExtent({
                        tipLabel: 'Zoom to show whole image',
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
        declareNonReactiveProperties: function () {
            // Declare properties of this component that should *not* be reactive.
            // This is mostly OpenLayers stuff that should work as fast as possible
            // without being slowed down by Vue reactivity.
            this.map = this.createMap();
            this.styles = biigle.$require('annotations.stores.styles');
            this.imageLayer = new ol.layer.Image();
            this.tiledImageLayer = new ol.layer.Tile();

            this.annotationFeatures = new ol.Collection();
            this.annotationSource = new ol.source.Vector({
                features: this.annotationFeatures
            });
            this.annotationLayer = new ol.layer.Vector({
                source: this.annotationSource,
                zIndex: 100,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: this.styles.features,
            });

            this.selectInteraction = new ol.interaction.Select({
                // Use click instead of default singleclick because the latter is
                // delayed 250ms to ensure the event is no doubleclick. But we want
                // it to be as fast as possible.
                condition: ol.events.condition.click,
                style: this.styles.highlight,
                layers: [this.annotationLayer],
                // enable selecting multiple overlapping features at once
                multi: true
            });

            if (this.canModify) {
                // Map to detect which features were changed between modifystart and
                // modifyend events of the modify interaction.
                this.featureRevisionMap = {};
                this.modifyInteraction = new ol.interaction.Modify({
                    features: this.selectInteraction.getFeatures(),
                    // She Shift key must be pressed to delete vertices, so that new
                    // vertices can be drawn at the same position of existing
                    // vertices.
                    deleteCondition: function(event) {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    },
                });
            }
        },
        updateMapSize: function () {
            this.mapSize = this.map.getSize();
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
                this.featureRevisionMap[feature.getId()] = feature.getRevision();
            }, this);
        },
        handleFeatureModifyEnd: function (e) {
            var self = this;
            var annotations = e.features.getArray()
                .filter(function (feature) {
                    return self.featureRevisionMap[feature.getId()] !== feature.getRevision();
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
        focusAnnotation: function (annotation, fast, keepResolution) {
            var feature = this.annotationSource.getFeatureById(annotation.id);
            if (feature) {
                if (fast) {
                    delete this.viewFitOptions.duration;
                } else {
                    this.viewFitOptions.duration = 250;
                }

                if (keepResolution) {
                    this.viewFitOptions.minResolution = this.resolution;
                } else {
                    this.viewFitOptions.minResolution = 1;
                }

                this.map.getView().fit(feature.getGeometry(), this.viewFitOptions);
            }
        },
        fitImage: function () {
            this.map.getView().fit(this.extent, this.map.getSize());
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
                var self = this;
                e.feature.set('color', this.selectedLabel.color);

                // This callback is called when saving the annotation succeeded or
                // failed, to remove the temporary feature.
                var removeCallback = function () {
                    try {
                        self.annotationSource.removeFeature(e.feature);
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
                this.annotationSource.removeFeature(e.feature);
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
                this.annotationSource.addFeature(feature);
                this.handleNewFeature({feature: feature});
            } else {
                this.requireSelectedLabel();
            }
        },
        requireSelectedLabel: function () {
            biigle.$require('events').$emit('sidebar.open', 'labels');
            biigle.$require('messages.store').info('Please select a label first.');
            this.resetInteractionMode();
        },
        render: function () {
            if (this.map) {
                this.map.render();
            }
        },
        handleRegularImage: function (image, oldImage) {
            if (!image) {
                this.imageLayer.setSource(null);
            } else {
                this.imageLayer.setSource(new ol.source.Canvas({
                    canvas: image.canvas,
                    projection: this.projection,
                    canvasExtent: this.extent,
                    canvasSize: [image.width, image.height]
                }));
            }
        },
        handleTiledImage: function (image, oldImage) {
            if (!image) {
                this.tiledImageLayer.setSource(null);
            } else {
                this.tiledImageLayer.setSource(new ol.source.Zoomify({
                    url: image.url,
                    size: [image.width, image.height],
                    // Set the extent like this instead of default so static images
                    // and tiled images can be treated the same.
                    extent: [0, 0, image.width, image.height],
                    transition: 100,
                }));
            }
        },
        updateMousePosition: function (e) {
            this.mousePosition = e.coordinate;
        },
        refreshAnnotationSource: function (annotations, source) {
            var annotationsMap = {};
            annotations.forEach(function (annotation) {
                annotationsMap[annotation.id] = null;
            });

            var oldFeaturesMap = {};
            var oldFeatures = source.getFeatures();
            var removedFeatures = oldFeatures.filter(function (feature) {
                oldFeaturesMap[feature.getId()] = null;
                return !annotationsMap.hasOwnProperty(feature.getId());
            });

            if (removedFeatures.length === oldFeatures.length) {
                // In case we switched the images, we want to clear and redraw all
                // features.
                source.clear(true);
            } else {
                // In case annotations were added/removed, we only want to update the
                // changed features. But don't remove the temporary annotations with
                // undefined ID here. These will be removed asynchronously through
                // their removeCallback when they were saved (or failed to be).
                // see: https://github.com/biigle/annotations/issues/82
                removedFeatures.filter(function (feature) {
                        return feature.getId() !== undefined;
                    }).forEach(function (feature) {
                        source.removeFeature(feature);
                    }, this);

                annotations = annotations.filter(function (annotation) {
                    return !oldFeaturesMap.hasOwnProperty(annotation.id);
                });
            }

            source.addFeatures(annotations.map(this.createFeature));
        },
    },
    watch: {
        image: function (image, oldImage) {
            if (!image) {
                this.map.removeLayer(this.tiledImageLayer);
                this.map.removeLayer(this.imageLayer);
            } else if (image.tiled === true) {
                if (!oldImage || oldImage.tiled !== true) {
                    this.map.removeLayer(this.imageLayer);
                    this.map.addLayer(this.tiledImageLayer);
                }

                this.handleTiledImage(image, oldImage);
            } else {
                if (!oldImage || oldImage.tiled === true) {
                    this.map.removeLayer(this.tiledImageLayer);
                    this.map.addLayer(this.imageLayer);
                }

                this.handleRegularImage(image, oldImage);
            }
        },
        annotations: function (annotations) {
            this.refreshAnnotationSource(annotations, this.annotationSource);
            this.resetHoveredAnnotations();
        },
        selectedAnnotations: function (annotations) {
            var source = this.annotationSource;
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
            }

            this.map.setView(new ol.View({
                projection: this.projection,
                center: center,
                resolution: this.resolution,
                zoomFactor: 2,
                // Allow a maximum of 4x magnification for non-tiled images.
                minResolution: 0.25,
                // Restrict movement.
                extent: extent
            }));

            if (this.resolution === undefined) {
                this.map.getView().fit(extent);
            }

            // Fake a map moveend event here so everything that is dependent on the
            // map viwport is initialized.
            if (!this.initialized) {
                this.updateMapView({target: this.map});
                this.initialized = true;
            }
        },
        annotationOpacity: function (opacity) {
            this.annotationLayer.setOpacity(opacity);
        },
        isDefaultInteractionMode: function (defaultMode) {
            this.selectInteraction.setActive(defaultMode || this.isTranslating);
            if (this.canModify) {
                this.modifyInteraction.setActive(defaultMode);
            }
        },
    },
    created: function () {
        var self = this;
        this.declareNonReactiveProperties();

        // The name can be used for layer filters, e.g. with forEachFeatureAtPixel.
        this.annotationLayer.set('name', 'annotations');
        this.map.addLayer(this.annotationLayer);

        // These names are required by the minimap component.
        this.imageLayer.set('name', 'imageRegular');
        this.tiledImageLayer.set('name', 'imageTile');

        biigle.$require('events').$on('sidebar.toggle', function () {
            // This needs to be wrapped in a function so it is called without arguments.
            self.$nextTick(function () {
                self.map.updateSize();
            });
        });

        this.map.on('change:size', this.updateMapSize);
        this.map.on('moveend', this.updateMapView);
        this.map.on('pointermove', this.updateMousePosition);

        this.selectInteraction.on('select', this.handleFeatureSelect);
        this.map.addInteraction(this.selectInteraction);

        var kb = biigle.$require('keyboard');
        kb.on(' ', this.handleNext, 0, this.listenerSet);
        kb.on('ArrowRight', this.handleNext, 0, this.listenerSet);
        kb.on('ArrowLeft', this.handlePrevious, 0, this.listenerSet);
        kb.on('Escape', this.resetInteractionMode, 0, this.listenerSet);

        if (this.canModify) {
            this.modifyInteraction.on('modifystart', this.handleFeatureModifyStart);
            this.modifyInteraction.on('modifyend', this.handleFeatureModifyEnd);
            this.map.addInteraction(this.modifyInteraction);
        }

        if (this.canDelete) {
            kb.on('Delete', this.deleteSelectedAnnotations, 0, this.listenerSet);
            kb.on('Backspace', this.deleteLastCreatedAnnotation, 0, this.listenerSet);
        }
    },
    mounted: function () {
        this.map.setTarget(this.$el);
    },
});
