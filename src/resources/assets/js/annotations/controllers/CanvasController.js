/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', function ($scope, mapImage) {
		"use strict";

		var map = new ol.Map({
			target: 'canvas',
			layers: []
		});

		// update the URL parameters
		map.on('moveend', function(e) {
			var view = map.getView();
			$scope.$emit('canvas.moveend', {
				center: view.getCenter(),
				zoom: view.getZoom()
			});
		});

		mapImage.init(map, $scope);
	}
);