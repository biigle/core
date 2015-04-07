/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SVGController
 * @memberOf dias.annotations
 * @description Controller for the annotation canvas SVG element
 */
angular.module('dias.annotations').controller('SVGController', function ($scope, $element) {
		"use strict";

		// the scale change per scaling operation
		var scaleStep = 0.05;
		// the minimal scale
		var minScale = 1;
		// is the user currently panning?
		var panning = false;
		// translate values when panning starts
		var panningStartTranslateX = 0;
		var panningStartTranslateY = 0;
		// mouse position when panning starts
		var panningStartMouseX = 0;
		var panningStartMouseY = 0;

		// the current scale of the elements
		$scope.scale = 1;
		// the current translation (position) of the elements
		$scope.translateX = 0;
		$scope.translateY = 0;
		// mouse position taking zooming and translating into account
		$scope.relativeMouseX = $scope.mouseX;
		$scope.relativeMouseY = $scope.mouseY;

		// makes sure the translate boundaries are kept
		var updateTranslate = function (translateX, translateY) {
			// scaleFactor for the right/bottom edge
			var scaleFactor = 1 - $scope.scale;
			// right
			translateX = Math.max(translateX, $scope.width * scaleFactor);
			// bottom
			translateY = Math.max(translateY, $scope.height * scaleFactor);
			// left
			$scope.translateX = Math.min(translateX, 0);
			// top
			$scope.translateY = Math.min(translateY, 0);
		};

		// scale towards the cursor
		// see http://stackoverflow.com/a/20996105/1796523
		var updateScaleTranslate = function (scale, oldScale) {
			var scaleDifference = scale / oldScale;

			var translateX = scaleDifference * ($scope.translateX - $scope.mouseX) + $scope.mouseX;
			var translateY = scaleDifference * ($scope.translateY - $scope.mouseY) + $scope.mouseY;

			updateTranslate(translateX, translateY);
		};

		$scope.$watch('scale', updateScaleTranslate);

		var updateRelativeMouseX = function (mouseX) {
			$scope.relativeMouseX = (mouseX - $scope.translateX) / $scope.scale;
		};

		$scope.$watch('mouseX', updateRelativeMouseX);

		var updateRelativeMouseY = function (mouseY) {
			$scope.relativeMouseY = (mouseY - $scope.translateY) / $scope.scale;
		};

		$scope.$watch('mouseY', updateRelativeMouseY);

		var zoom = function (e) {
			var scale = $scope.scale - scaleStep * e.deltaY;
			$scope.scale = Math.max(scale, minScale);
			e.preventDefault();
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { zoom(e); });
		});

		$scope.startPanning = function (event) {
			panning = true;
			panningStartTranslateX = $scope.translateX;
			panningStartTranslateY = $scope.translateY;
			panningStartMouseX = $scope.mouseX;
			panningStartMouseY = $scope.mouseY;

			// prevent default drag & drop behaviour for images
			event.preventDefault();
		};

		$scope.pan = function () {
			if (!panning) return;

			var translateX = panningStartTranslateX - (panningStartMouseX - $scope.mouseX);
			var translateY = panningStartTranslateY - (panningStartMouseY - $scope.mouseY);

			updateTranslate(translateX, translateY);
		};

		$scope.stopPanning = function () {
			panning = false;
		};
	}
);