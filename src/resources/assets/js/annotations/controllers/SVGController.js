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
		// translate values when panning starts
		var panningStartTranslateX = 0;
		var panningStartTranslateY = 0;
		// mouse position when panning starts
		var panningStartMouseX = 0;
		var panningStartMouseY = 0;

		// the inherited svg state object
		var svg = $scope.svg;

		// is the user currently panning?
		$scope.panning = false;

		// makes sure the translate boundaries are kept
		var updateTranslate = function (translateX, translateY) {
			// scaleFactor for the right/bottom edge
			var scaleFactor = 1 - svg.scale;
			// right
			translateX = Math.max(translateX, $scope.width * scaleFactor);
			// bottom
			translateY = Math.max(translateY, $scope.height * scaleFactor);
			// left
			translateX = Math.min(translateX, 0);
			// top
			translateY = Math.min(translateY, 0);

			svg.translateX = Math.round(translateX);
			svg.translateY = Math.round(translateY);
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
			scale = Math.round(scale * 1000) / 1000;
			svg.scale = Math.max(scale, minScale);
			e.preventDefault();
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { zoom(e); });
		});

		$scope.startPanning = function (event) {
			$scope.panning = true;
			panningStartTranslateX = svg.translateX;
			panningStartTranslateY = svg.translateY;
			panningStartMouseX = $scope.mouseX;
			panningStartMouseY = $scope.mouseY;

			// prevent default drag & drop behaviour for images
			event.preventDefault();
			$scope.$emit('svg.panning.start');
		};

		$scope.pan = function () {
			if (!$scope.panning) return;

			var translateX = panningStartTranslateX - (panningStartMouseX - $scope.mouseX);
			var translateY = panningStartTranslateY - (panningStartMouseY - $scope.mouseY);

			updateTranslate(translateX, translateY);
		};

		$scope.stopPanning = function () {
			$scope.panning = false;
			$scope.$emit('svg.panning.stop');
		};
	}
);