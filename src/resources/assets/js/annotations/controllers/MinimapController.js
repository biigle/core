/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name MinimapController
 * @memberOf dias.annotations
 * @description Controller for the minimap in the sidebar
 */
angular.module('dias.annotations').controller('MinimapController', function ($scope, map, mapImage, $element, styles) {
		"use strict";

		var minimap = new ol.Map({
			target: 'minimap',
			// remove controls
			controls: [],
			// disable interactions
			interactions: []
		});
		// get the same layers than the map
		minimap.bindTo('layergroup', map);

		var featureOverlay = new ol.FeatureOverlay({
			map: minimap,
			style: styles.viewport
		});

		var viewport = new ol.Feature();
		featureOverlay.addFeature(viewport);

		// refresh the view (the image size could have been changed)
		$scope.$on('image.shown', function () {
			minimap.setView(new ol.View({
				projection: mapImage.getProjection(),
				center: ol.extent.getCenter(mapImage.getExtent()),
				zoom: 0
			}));
		});

		// move the viewport rectangle on the minimap
		var refreshViewport = function () {
			var extent = map.getView().calculateExtent(map.getSize());
			viewport.setGeometry(ol.geom.Polygon.fromExtent(extent));
		};

		map.on('moveend', refreshViewport);

		var dragViewport = function (e) {
			map.getView().setCenter(e.coordinate);
		};

		minimap.on('pointerdrag', dragViewport);

		$element.on('mouseleave', function () {
			minimap.un('pointerdrag', dragViewport);
		});

		$element.on('mouseenter', function () {
			minimap.on('pointerdrag', dragViewport);
		});
	}
);