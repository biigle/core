/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', function ($scope, $element) {
		"use strict";

		var offsetTop = 0;

		// the current mouse position relative to the canvas container
		$scope.mouseX = 0;
		$scope.mouseY = 0;

		// the dimensions of the canvas container
		var updateDimensions = function () {
			$scope.width = $element[0].offsetWidth;
			$scope.height = $element[0].offsetHeight;
		};

		updateDimensions();

		window.addEventListener('resize', function () {
			$scope.$apply(updateDimensions);
		});

		$scope.updateMouse = function (e) {
			$scope.mouseX = e.clientX;
			$scope.mouseY = e.clientY - offsetTop;
		};

		var updateOffset = function () {
			offsetTop = $element[0].offsetTop;
		};

		updateOffset();

		window.addEventListener('resize', updateOffset);
	}
);