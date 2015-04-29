/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ControlsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar control buttons
 */
angular.module('dias.annotations').controller('ControlsController', function ($scope, mapAnnotations) {
		"use strict";

		var drawing = false;

		$scope.selectShape = function (name) {
			mapAnnotations.finishDrawing();

			if (drawing || name === null) {
				$scope.selectedShape = '';
				drawing = false;
			} else {
				$scope.selectedShape = name;
				mapAnnotations.startDrawing(name);
				drawing = true;
			}
		};
	}
);