/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ControlsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar controls
 */
angular.module('dias.annotations').controller('ControlsController', function ($scope, mapAnnotations, shapes) {
		"use strict";
		var drawing = false;

		$scope.selectedShape = {};

		$scope.toggleDrawing = function () {
			if (drawing) {
				mapAnnotations.finishDrawing();
				drawing = false;
			} else {
				mapAnnotations.startDrawing($scope.selectedShape.name);
				drawing = true;
			}
		};

		$scope.shapes = shapes.getAll();

		$scope.deleteSelected = mapAnnotations.deleteSelected;
	}
);