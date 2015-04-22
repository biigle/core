/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ControlsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar controls
 */
angular.module('dias.annotations').controller('ControlsController', function ($scope, mapAnnotations) {
		"use strict";
		var drawing = false;

		$scope.toggleDrawing = function () {
			if (drawing) {
				mapAnnotations.finishDrawing();
				drawing = false;
			} else {
				mapAnnotations.startDrawing('Polygon');
				drawing = true;
			}
		};
	}
);