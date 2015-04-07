/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SVGController
 * @memberOf dias.annotations
 * @description Controller for the annotation canvas SVG element handling
 * the zooming and panning etc.
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

		// the inherited svg state object
		var svg = $scope.svg;

		// makes sure the translate boundaries are kept
		var updateTranslate = function (translateX, translateY) {
			// scaleFactor for the right/bottom edge
			var scaleFactor = 1 - svg.scale;
			// right
			translateX = Math.max(translateX, $scope.width * scaleFactor);
			// bottom
			translateY = Math.max(translateY, $scope.height * scaleFactor);
			// left
			svg.translateX = Math.min(translateX, 0);
			// top
			svg.translateY = Math.min(translateY, 0);
		};

		// scale towards the cursor
		// see http://stackoverflow.com/a/20996105/1796523
		var updateScaleTranslate = function (scale, oldScale) {
			var scaleDifference = scale / oldScale;

			var translateX = scaleDifference * (svg.translateX - $scope.mouseX) + $scope.mouseX;
			var translateY = scaleDifference * (svg.translateY - $scope.mouseY) + $scope.mouseY;

			updateTranslate(translateX, translateY);
		};

		$scope.$watch('svg.scale', updateScaleTranslate);

		var updateMouseX = function (mouseX) {
			svg.mouseX = (mouseX - svg.translateX) / svg.scale;
		};

		$scope.$watch('mouseX', updateMouseX);

		var updateMouseY = function (mouseY) {
			svg.mouseY = (mouseY - svg.translateY) / svg.scale;
		};

		$scope.$watch('mouseY', updateMouseY);

		var zoom = function (e) {
			var scale = svg.scale - scaleStep * e.deltaY;
			svg.scale = Math.max(scale, minScale);
			e.preventDefault();
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { zoom(e); });
		});

		$scope.startPanning = function (event) {
			panning = true;
			panningStartTranslateX = svg.translateX;
			panningStartTranslateY = svg.translateY;
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