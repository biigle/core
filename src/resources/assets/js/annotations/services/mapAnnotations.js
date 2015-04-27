/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', function (map, images, annotations, debounce, styles) {
		"use strict";

		var featureOverlay = new ol.FeatureOverlay({
			style: styles.features
		});

		var features = new ol.Collection();

		featureOverlay.setFeatures(features);

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select({
			style: styles.highlight
		});

		var selectedFeatures = select.getFeatures();

		var modify = new ol.interaction.Modify({
			features: featureOverlay.getFeatures(),
			// the SHIFT key must be pressed to delete vertices, so
			// that new vertices can be drawn at the same position
			// of existing vertices
			deleteCondition: function(event) {
				return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
			}
		});

		// drawing interaction
		var draw;

		// convert a point array to a point object
		// re-invert the y axis
		var convertFromOLPoint = function (point) {
			return {x: point[0], y: images.currentImage.height - point[1]};
		};

		// convert a point object to a point array
		// invert the y axis
		var convertToOLPoint = function (point) {
			return [point.x, images.currentImage.height - point.y];
		};

		// assembles the coordinate arrays depending on the geometry type
		// so they have a unified format
		var getCoordinates = function (geometry) {
			switch (geometry.getType()) {
				case 'Circle':
					// radius is the x value of the second point of the circle
					return [geometry.getCenter(), [geometry.getRadius(), 0]];
				case 'Polygon':
					return geometry.getCoordinates()[0];
				case 'Point':
					return [geometry.getCoordinates()];
				default:
					return geometry.getCoordinates();
			}
		};

		// saves the updated geometry of an annotation feature
		var handleGeometryChange = function (e) {
			var feature = e.target;
			var save = function () {
				var coordinates = getCoordinates(feature.getGeometry());
				feature.annotation.points = coordinates.map(convertFromOLPoint);
				feature.annotation.$save();
			};
			// this event is rapidly fired, so wait until the firing stops
			// before saving the changes
			debounce(save, 500, feature.annotation.id);
		};

		var createFeature = function (annotation) {
			var geometry;
			var points = annotation.points.map(convertToOLPoint);

			switch (annotation.shape) {
				case 'Point':
					geometry = new ol.geom.Point(points[0]);
					break;
				case 'Polygon':
					// close the polygon
					points.push(points[0]);
					// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
					geometry = new ol.geom.Polygon([ points ]);
					break;
				case 'LineString':
					geometry = new ol.geom.LineString(points);
					break;
				case 'Circle':
					// radius is the x value of the second point of the circle
					geometry = new ol.geom.Circle(points[0], points[1][0]);
			}

			var feature = new ol.Feature({ geometry: geometry });
			feature.on('change', handleGeometryChange);
			feature.annotation = annotation;
			features.push(feature);
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
			features.clear();

			annotations.query({id: image._id}).$promise.then(function () {
				annotations.forEach(createFeature);
			});
		};

		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
			var coordinates = getCoordinates(geometry);

			e.feature.annotation = annotations.add({
				id: images.getCurrentId(),
				shape: geometry.getType(),
				points: coordinates.map(convertFromOLPoint)
			});
		};

		this.init = function (scope) {
			featureOverlay.setMap(map);
			map.addInteraction(select);
			scope.$on('image.shown', refreshAnnotations);

			selectedFeatures.on('change:length', function () {
				// if not already digesting, digest
				if (!scope.$$phase) {
					// propagate new selections through the angular application
					scope.$apply();
				}
			});
		};

		this.startDrawing = function (type) {
			map.removeInteraction(select);

			type = type || 'Point';
			
			draw = new ol.interaction.Draw({
				features: features,
				type: type,
				style: styles.editing
			});
			map.addInteraction(modify);
			map.addInteraction(draw);
			draw.on('drawend', handleNewFeature);
		};

		this.finishDrawing = function () {
			map.removeInteraction(draw);
			map.removeInteraction(modify);
			map.addInteraction(select);
		};

		this.deleteSelected = function () {
			selectedFeatures.forEach(function (feature) {
				features.remove(feature);
				annotations.delete(feature.annotation);
			});
			selectedFeatures.clear();
		};

		this.select = function (id) {
			var feature;
			features.forEach(function (f) {
				if (f.annotation.id === id) {
					feature = f;
				}
			});
			// remove selection if feature was already selected. otherwise select.
			if (!selectedFeatures.remove(feature)) {
				selectedFeatures.push(feature);
			}
		};

		this.clearSelection = function () {
			selectedFeatures.clear();
		};

		this.getSelectedFeatures = function () {
			return selectedFeatures;
		};
	}
);