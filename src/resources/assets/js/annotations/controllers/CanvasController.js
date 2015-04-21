/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', function ($scope) {
		"use strict";

		var extent = [0, 0, 0, 0];

		var projection = new ol.proj.Projection({
			code: 'dias-image',
			units: 'pixels',
			extent: extent
		});

		var imageLayer = new ol.layer.Image();

		var map = new ol.Map({
			target: 'canvas',
			layers: [imageLayer],
		});

		map.on('moveend', function(e) {
			var view = map.getView();
			$scope.$emit('canvas.moveend', {
				center: view.getCenter(),
				zoom: view.getZoom()
			});
		});

		$scope.$on('image.shown', function (e, image) {
			extent[2] = image.width;
			extent[3] = image.height;

			var zoom = $scope.viewport.zoom;

			var center = $scope.viewport.center;
			// viewport center is still uninitialized
			if (center[0] === undefined && center[1] === undefined) {
				center = ol.extent.getCenter(extent);
			}

			var imageStatic = new ol.source.ImageStatic({
				url: image.src,
				projection: projection,
				imageExtent: extent
			});

			imageLayer.setSource(imageStatic);

			map.setView(new ol.View({
				projection: projection,
				center: center,
				zoom: zoom,
				// allow a maximum of 4x magnification
				minResolution: 0.25,
				// restrict movement
				extent: extent
			}));

			// if zoom is not initialized, fit the view to the image extent
			if (zoom === undefined) {
				map.getView().fitExtent(extent, map.getSize());
			}
		});
	}
);