/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', function (map, images, annotations, debounce, styles, $interval, labels, mapInteractions) {
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
        map.addLayer(annotationLayer);

        // all annotations that are currently selected
        var selectedFeatures = mapInteractions.init('select', [annotationLayer])
            .getFeatures();

        mapInteractions.init('modify', annotationFeatures);
        mapInteractions.deactivate('modify');

        mapInteractions.init('translate', selectedFeatures);
        mapInteractions.deactivate('translate');

        mapInteractions.init('attachLabel', annotationFeatures);
        mapInteractions.deactivate('attachLabel');

        // index of the currently selected annotation (during cycling through annotations)
        // in the annotationFeatures collection
        var currentAnnotationIndex = 0;

        // the annotation that was drawn last during the current session
        var lastDrawnFeature;

        // options to use for the view.fit function
        var viewFitOptions = {
            padding: [50, 50, 50, 50],
            minResolution: 1
        };

        var _this = this;

        // scope of the CanvasController
        var _scope;

        // selects a single annotation and moves the viewport to it
        var selectAndShowAnnotation = function (annotation) {
            _this.clearSelection();
            if (annotation) {
                selectedFeatures.push(annotation);
                map.getView().fit(annotation.getGeometry(), map.getSize(), viewFitOptions);
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
                annotations.save(feature.annotation);
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

        // redraw all features
		var refreshAnnotations = function (a) {
            annotationSource.clear();
			_this.clearSelection();
            lastDrawnFeature = null;
			a.forEach(createFeature);
		};
        annotations.observe(refreshAnnotations);

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

            annotations.delete(feature.annotation);
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
            _this.onSelectedAnnotation(function () {
                // if not already digesting, digest
                if (!scope.$$phase) {
                    // propagate new selections through the angular application
                    scope.$apply();
                }
            });
		};

        // put the map into drawing mode
		this.startDrawing = function (type) {
            mapInteractions.init('draw', type, annotationSource);
            mapInteractions.on('draw', 'drawend', handleNewFeature);
            mapInteractions.on('draw', 'drawend', function (e) {
                _scope.$broadcast('annotations.drawn', e.feature);
            });
		};

        // put the map out of drawing mode
		this.finishDrawing = function () {
            mapInteractions.deactivate('draw');
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

        // do something whenever annotations are (de-)selected
        this.onSelectedAnnotation = function (callback) {
            return mapInteractions.on('select', 'select', callback);
        };

        this.offSelectedAnnotation = function (callback) {
            return mapInteractions.un('select', 'select', callback);
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
            view.fit(feature.getGeometry(), map.getSize(), viewFitOptions);
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
            currentAnnotationIndex = (currentAnnotationIndex + 1) % annotationFeatures.getLength();
            _this.jumpToCurrent();
        };

        this.hasNext = function () {
            return (currentAnnotationIndex + 1) < annotationFeatures.getLength();
        };

        // move the viewport to the previous annotation
        this.cyclePrevious = function () {
            // we want no negative index here
            var length = annotationFeatures.getLength();
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
                selectAndShowAnnotation(annotationFeatures.item(currentAnnotationIndex));
            });
        };

        this.jumpToFirst = function () {
            currentAnnotationIndex = 0;
            _this.jumpToCurrent();
        };

        this.jumpToLast = function () {
            // wait for the new annotations to be loaded
            annotations.getPromise().then(function (a) {
                if (a.length !== 0) {
                    currentAnnotationIndex = a.length - 1;
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
            return annotationFeatures.item(currentAnnotationIndex).annotation;
        };
	}
);
