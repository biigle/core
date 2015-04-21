/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', function (ImageAnnotation, AnnotationLabel, AnnotationPoint, Shape) {
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

				featureOverlay.addFeature(new ol.Feature({ geometry: geometry }));
			});
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
			featureOverlay.setFeatures(new ol.Collection());

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

		// var modify = new ol.interaction.Modify({
		// 	features: featureOverlay.getFeatures(),
		// 	// the SHIFT key must be pressed to delete vertices, so
		// 	// that new vertices can be drawn at the same position
		// 	// of existing vertices
		// 	deleteCondition: function(event) {
		// 		return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
		// 	}
		// });

		// var draw = new ol.interaction.Draw({
		// 	features: featureOverlay.getFeatures(),
		// 	type: /** @type {ol.geom.GeometryType} */ 'Point'
		// });

		this.init = function (map, scope) {
			featureOverlay.setMap(map);
			// map.addInteraction(modify);
			// map.addInteraction(draw);
			map.addInteraction(select);
			scope.$on('image.shown', refreshAnnotations);
		};
	}
);