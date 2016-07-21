/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', function (map, images, annotations, debounce, styles, $interval, labels, AttachLabelInteraction) {
		"use strict";

        // the geometric features of the annotations on the map
        var annotationFeatures = new ol.Collection();
        var annotationSource = new ol.source.Vector({
            features: annotationFeatures
        });
        var annotationLayer = new ol.layer.Vector({
            source: annotationSource,
            style: styles.features,
            zIndex: 100,
            updateWhileAnimating: true,
            updateWhileInteracting: true
        });

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select({
			style: styles.highlight,
            layers: [annotationLayer],
            // enable selecting multiple overlapping features at once
            multi: true
		});

        // all annotations that are currently selected
		var selectedFeatures = select.getFeatures();

        // interaction for modifying annotations
		var modify = new ol.interaction.Modify({
			features: annotationFeatures,
			// the SHIFT key must be pressed to delete vertices, so
			// that new vertices can be drawn at the same position
			// of existing vertices
			deleteCondition: function(event) {
				return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
			}
		});

        modify.setActive(false);

        // interaction for moving annotations
        var translate = new ol.interaction.Translate({
            features: selectedFeatures
        });

        translate.setActive(false);

        // interaction to attach labels to existing annotations
        var attachLabel = new AttachLabelInteraction({
            features: annotationFeatures
        });

        attachLabel.setActive(false);

		// drawing interaction, will be a new one for each drawing tool
		var draw;
        // type/shape of the drawing interaction
        var drawingType;

        // index of the currently selected annotation (during cycling through annotations)
        // in the annotationFeatures collection
        var currentAnnotationIndex = 0;

        // the annotation that was drawn last during the current session
        var lastDrawnFeature;

        // restrict cycling through annotations to those having the currently selected
        // label category
        var restrictLabelCategory = false;

        var _this = this;

        // scope of the CanvasController
        var _scope;

        // selects a single annotation and moves the viewport to it
        var selectAndShowAnnotation = function (annotation) {
            _this.clearSelection();
            if (annotation) {
                selectedFeatures.push(annotation);
                map.getView().fit(annotation.getGeometry(), map.getSize(), {
                    padding: [50, 50, 50, 50]
                });
            }
        };

        // invert y coordinates of a points array
        var convertFromOLPoint = function (point, index) {
            return (index % 2 === 1) ? (images.currentImage.height - point) : point;
        };

		// assembles the coordinate arrays depending on the geometry type
		// so they have a unified format
		var getCoordinates = function (geometry) {
            var coordinates;
			switch (geometry.getType()) {
				case 'Circle':
					// radius is the x value of the second point of the circle
					coordinates = [geometry.getCenter(), [geometry.getRadius()]];
                    break;
				case 'Polygon':
				case 'Rectangle':
					coordinates = geometry.getCoordinates()[0];
                    break;
				case 'Point':
					coordinates = [geometry.getCoordinates()];
                    break;
				default:
					coordinates = geometry.getCoordinates();
			}

            // merge the individual point arrays to a single array
            // round the coordinates to integers
            return Array.prototype.concat.apply([], coordinates)
                .map(Math.round)
                .map(convertFromOLPoint);
		};

		// saves the updated geometry of an annotation feature
		var handleGeometryChange = function (e) {
			var feature = e.target;
			var save = function () {
				feature.annotation.points = getCoordinates(feature.getGeometry());
				feature.annotation.$save();
			};
			// this event is rapidly fired, so wait until the firing stops
			// before saving the changes
			debounce(save, 500, feature.annotation.id);
		};

        // create a new OL feature on the map based on an annotation object
		var createFeature = function (annotation) {
			var geometry;
			var points = annotation.points;
            var newPoints = [];
            var height = images.currentImage.height;
            // convert points array to OL points
            for (var i = 0; i < points.length; i += 2) {
                newPoints.push([
                    points[i],
                    // invert the y axis to OL coordinates
                    // circles have no fourth point so we take 0
                    height - (points[i + 1] || 0)
                ]);
            }

			switch (annotation.shape) {
				case 'Point':
					geometry = new ol.geom.Point(newPoints[0]);
					break;
				case 'Rectangle':
					geometry = new ol.geom.Rectangle([ newPoints ]);
					break;
				case 'Polygon':
					// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
					geometry = new ol.geom.Polygon([ newPoints ]);
					break;
				case 'LineString':
					geometry = new ol.geom.LineString(newPoints);
					break;
				case 'Circle':
					// radius is the x value of the second point of the circle
					geometry = new ol.geom.Circle(newPoints[0], newPoints[1][0]);
					break;
                // unsupported shapes are ignored
                default:
                    console.error('Unknown annotation shape: ' + annotation.shape);
                    return;
			}

			var feature = new ol.Feature({ geometry: geometry });
            feature.annotation = annotation;
            if (annotation.labels && annotation.labels.length > 0) {
                feature.color = annotation.labels[0].label.color;
            }
			feature.on('change', handleGeometryChange);
            annotationSource.addFeature(feature);
		};

        // redraw all features with those belonging to the specified image
		var refreshAnnotations = function (e, image) {
			// clear features of previous image
            annotationSource.clear();
			_this.clearSelection();
            lastDrawnFeature = null;

			annotations.query({id: image._id}).$promise.then(function () {
				annotations.forEach(createFeature);
			});
		};

        // handle a newly drawn annotation
		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
            var label = labels.getSelected();

            e.feature.color = label.color;

			e.feature.annotation = annotations.add({
				id: images.getCurrentId(),
				shape: geometry.getType(),
				points: getCoordinates(geometry),
                label_id: label.id,
                confidence: labels.getCurrentConfidence()
			});

			// if the feature couldn't be saved, remove it again
			e.feature.annotation.$promise.catch(function () {
                annotationSource.removeFeature(e.feature);
			});

			e.feature.on('change', handleGeometryChange);

            lastDrawnFeature = e.feature;

            return e.feature.annotation.$promise;
		};

        // handle the removal of an annotation
        var removeFeature = function (feature) {
            if (!feature || !feature.annotation) return;

            if (feature === lastDrawnFeature) {
                lastDrawnFeature = null;
            }

            annotations.delete(feature.annotation).then(function () {
                annotationSource.removeFeature(feature);
                selectedFeatures.remove(feature);
            });
        };

        // returns true if the supplied annotation has a label of the same category than
        // the currently selected category
        var annotationHasCurrentLabel = function (annotation) {
            if (!annotation.labels) return false;
            var id = labels.getSelectedId();
            for (var i = 0; i < annotation.labels.length; i++) {
                if (!annotation.labels[i].label) continue;
                if (annotation.labels[i].label.id === id) {
                    return true;
                }
            }

            return false;
        };

        // filters out any annotation that does
        var filterAnnotationsLabelCategory = function (feature) {
            return !restrictLabelCategory || annotationHasCurrentLabel(feature.annotation);
        };

        var getFilteredAnnotationFeatures = function () {
            return annotationFeatures.getArray().filter(filterAnnotationsLabelCategory);
        };

        // get the feature that represents the given annotation
        var getFeature = function (annotation) {
            var features = annotationFeatures.getArray();
            for (var i = features.length - 1; i >= 0; i--) {
                if (features[i].annotation.id === annotation.id) {
                    return features[i];
                }
            }

            return null;
        };

		this.init = function (scope) {
            _scope = scope;
            map.addLayer(annotationLayer);
			map.addInteraction(select);
            map.addInteraction(translate);
            map.addInteraction(attachLabel);
            map.addInteraction(modify);
			scope.$on('image.shown', refreshAnnotations);

            var apply = function () {
                // if not already digesting, digest
                if (!scope.$$phase) {
                    // propagate new selections through the angular application
                    scope.$apply();
                }
            };

			selectedFeatures.on('change:length', apply);
		};

        // put the map into drawing mode
		this.startDrawing = function (type) {
            select.setActive(false);
            modify.setActive(true);
            _this.finishMoving();
            _this.finishAttaching();
            // allow only one draw interaction at a time
            map.removeInteraction(draw);

			drawingType = type || 'Point';
			draw = new ol.interaction.Draw({
                source: annotationSource,
				type: drawingType,
				style: styles.editing
			});

			map.addInteraction(draw);
			draw.on('drawend', handleNewFeature);
            draw.on('drawend', function (e) {
                _scope.$broadcast('annotations.drawn', e.feature);
            });
		};

        // put the map out of drawing mode
		this.finishDrawing = function () {
            if (!_this.isDrawing()) return;

			map.removeInteraction(draw);
            draw.setActive(false);
            drawingType = undefined;
            select.setActive(true);
            modify.setActive(false);
			// don't select the last drawn point
			_this.clearSelection();
		};

        this.isDrawing = function () {
            return draw && draw.getActive();
        };

        // put the map into moving mode (of an annotation)
        this.startMoving = function () {
            _this.finishDrawing();
            _this.finishAttaching();
            translate.setActive(true);
        };

        this.finishMoving = function () {
            translate.setActive(false);
        };

        this.isMoving = function () {
            return translate.getActive();
        };

        // put the map into "attach label to annotation" mode
        this.startAttaching = function () {
            _this.finishDrawing();
            _this.finishMoving();
            attachLabel.setActive(true);
        };

        this.finishAttaching = function () {
            attachLabel.setActive(false);
        };

        this.isAttaching = function () {
            return attachLabel.getActive();
        };

        this.hasDrawnAnnotation = function () {
            return lastDrawnFeature &&
                lastDrawnFeature.annotation &&
                lastDrawnFeature.annotation.$resolved;
        };

        this.deleteLastDrawnAnnotation = function () {
            removeFeature(lastDrawnFeature);
        };

		this.deleteSelected = function () {
			selectedFeatures.forEach(removeFeature);
		};

        this.deleteAnnotation = function (annotation) {
            removeFeature(getFeature(annotation));
        };

        // programmatically de-/select an annotation (not through the select interaction)
		this.toggleSelect = function (annotation, multiple) {
            var feature = getFeature(annotation);
            if (!feature) return;

			// remove selection if feature was already selected
			if (!selectedFeatures.remove(feature)) {
                if (!multiple) {
                    // clear if feature was not selected and should not be added to existing selections
                    _this.clearSelection();
                }
				selectedFeatures.push(feature);
			}
		};

        this.hasSelectedFeatures = function () {
            return selectedFeatures.getLength() > 0;
        };

        // fits the view to the given annotation
        this.fit = function (annotation) {
            var feature = getFeature(annotation);
            if (!feature) return;

            // animate fit
            var view = map.getView();
            var pan = ol.animation.pan({
                source: view.getCenter()
            });
            var zoom = ol.animation.zoom({
                resolution: view.getResolution()
            });
            map.beforeRender(pan, zoom);
            view.fit(feature.getGeometry(), map.getSize());
        };

        this.isAnnotationSelected = function (annotation) {
            var features = selectedFeatures.getArray();
            for (var i = features.length - 1; i >= 0; i--) {
                if (features[i].annotation && features[i].annotation.id === annotation.id) {
                    return true;
                }
            }

            return false;
        };

		this.clearSelection = function () {
			selectedFeatures.clear();
		};

		this.getSelectedFeatures = function () {
			return selectedFeatures;
		};

        this.getSelectedDrawingType = function () {
            return drawingType;
        };

        // programatically add a new feature (not through the draw interaction)
        this.addFeature = function (feature) {
            annotationSource.addFeature(feature);
            return handleNewFeature({feature: feature});
        };

        this.setOpacity = function (opacity) {
            annotationLayer.setOpacity(opacity);
        };

        // move the viewport to the next annotation
        this.cycleNext = function () {
            currentAnnotationIndex = (currentAnnotationIndex + 1) % getFilteredAnnotationFeatures().length;
            _this.jumpToCurrent();
        };

        this.hasNext = function () {
            return (currentAnnotationIndex + 1) < getFilteredAnnotationFeatures().length;
        };

        // move the viewport to the previous annotation
        this.cyclePrevious = function () {
            // we want no negative index here
            var length = getFilteredAnnotationFeatures().length;
            currentAnnotationIndex = (currentAnnotationIndex + length - 1) % length;
            _this.jumpToCurrent();
        };

        this.hasPrevious = function () {
            return currentAnnotationIndex > 0;
        };

        // move the viewport to the current annotation
        this.jumpToCurrent = function () {
            // only jump once the annotations were loaded
            annotations.getPromise().then(function () {
                selectAndShowAnnotation(getFilteredAnnotationFeatures()[currentAnnotationIndex]);
            });
        };

        this.jumpToFirst = function () {
            currentAnnotationIndex = 0;
            _this.jumpToCurrent();
        };

        this.jumpToLast = function () {
            annotations.getPromise().then(function () {
                var length = getFilteredAnnotationFeatures().length;
                // wait for the new annotations to be loaded
                if (length !== 0) {
                    currentAnnotationIndex = length - 1;
                }
                _this.jumpToCurrent();
            });
        };

        // flicker the highlighted annotation to signal an error
        this.flicker = function (count) {
            var annotation = selectedFeatures.item(0);
            if (!annotation) return;
            count = count || 3;

            var toggle = function () {
                if (selectedFeatures.getLength() > 0) {
                    selectedFeatures.clear();
                } else {
                    selectedFeatures.push(annotation);
                }
            };
            // number of repeats must be even, otherwise the layer would stay onvisible
            $interval(toggle, 100, count * 2);
        };

        this.getCurrent = function () {
            return getFilteredAnnotationFeatures()[currentAnnotationIndex].annotation;
        };

        this.setRestrictLabelCategory = function (restrict) {
            restrictLabelCategory = restrict;
        };
	}
);
