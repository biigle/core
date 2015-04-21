/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', function ($scope, $element) {
		"use strict";

		var extent = [0, 0, 0, 0];

		var projection = new ol.proj.Projection({
			code: 'dias-image',
			units: 'pixels',
			extent: extent
		});

		// var view = new ol.View({
		// 	projection: projection,
		// 	zoom: 2
		// });

		var imageLayer = new ol.layer.Image();

		var map = new ol.Map({
			target: 'canvas',
			layers: [imageLayer],
			// view: view
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

			var imageStatic = new ol.source.ImageStatic({
				url: image.src,
				projection: projection,
				imageExtent: extent
			});

			imageLayer.setSource(imageStatic);

			map.setView(new ol.View({
				projection: projection,
				center: $scope.viewport.center,
				zoom: $scope.viewport.zoom
			}));
		});
	}
);