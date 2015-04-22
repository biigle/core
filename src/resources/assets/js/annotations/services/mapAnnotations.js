/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', function (ImageAnnotation, AnnotationLabel, AnnotationPoint, Shape, map, images) {
		"use strict";
		var shapes = {};
		Shape.query(function (s) {
			s.forEach(function (shape) {
				shapes[shape.id] = shape.name;
			});
		});

		var annotations = {};

		var featureOverlay = new ol.FeatureOverlay({
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: '#ffcc33',
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 7,
					fill: new ol.style.Fill({
						color: '#ffcc33'
					})
				})
			})
		});

		var features = new ol.Collection();
		featureOverlay.setFeatures(features);

		// convert a point array to a point object
		var convertFromOLPoint = function (point) {
			return {x: point[0], y: point[1]};
		};

		// convert a point object to a point array
		var convertToOLPoint = function (point) {
			return [point.x, point.y];
		};

		var createFeature = function (annotation) {
			annotation.points.$promise.then(function () {
				var geometry;
				var points = annotation.points.map(convertToOLPoint);

				switch (annotation.shape()) {
					case 'point':
						geometry = new ol.geom.Point(points[0]);
						break;
					case 'polygon':						
						// close the polygon
						points.push(points[0]);
						// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
						geometry = new ol.geom.Polygon([ points ]);
						break;
					case 'line':
						geometry = new ol.geom.LineString(points);
						break;
					case 'circle':
						// radius is the x value of the second point of the circle
						geometry = new ol.geom.Circle(points[0], points[1][0]);
				}

				features.push(new ol.Feature({ geometry: geometry }));
			});
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
			features.clear();

			annotations = ImageAnnotation.query({image_id: image._id});
			annotations.$promise.then(function () {
				annotations.forEach(function (annotation) {
					annotation.points = AnnotationPoint.query({annotation_id: annotation.id});
					annotation.labels = AnnotationLabel.query({annotation_id: annotation.id});
					annotation.shape = function () {
						return shapes[this.shape_id];
					};
				});

				annotations.forEach(createFeature);
			});
		};

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select();

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

		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
			var coordinates;
			if (geometry.getType === 'Circle') {
				coordinates = [[geometry.getCenter(), [geometry.getRadius(), 0]]];
			} else {
				coordinates = geometry.getCoordinates();
			}
			coordinates = coordinates[0];

			ImageAnnotation.add({
				image_id: images.getCurrentId(),
				shape_id: 3, //TODO
				points: coordinates.map(convertFromOLPoint)
			});
		};

		this.init = function (scope) {
			featureOverlay.setMap(map);
			map.addInteraction(modify);
			// map.addInteraction(draw);
			// map.addInteraction(select);
			scope.$on('image.shown', refreshAnnotations);
		};

		this.startDrawing = function (type) {
			type = type || 'Point';
			
			draw = new ol.interaction.Draw({
				features: features,
				type: type
			});
			map.addInteraction(draw);
			draw.on('drawend', handleNewFeature);
		};

		this.finishDrawing = function () {
			map.removeInteraction(draw);
		};
	}
);