/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SVGController
 * @memberOf dias.annotations
 * @description Controller for the annotation canvas SVG element
 */
angular.module('dias.annotations').controller('SVGController', function ($scope, $element) {
		"use strict";

		var scaleStep = 0.05;
		var scaleTmp;

		$scope.scale = 1;
		// translate the elements so they appear to be zooming towards the cursor
		$scope.scaleTranslateX = 0;
		$scope.scaleTranslateY = 0;
		$scope.translateX = 0;
		$scope.translateY = 0;
		// mouse position taking zooming and translating into account
		$scope.relativeMouseX = $scope.mouseX;
		$scope.relativeMouseY = $scope.mouseY;

		// scale around the cursor
		// see http://stackoverflow.com/a/20996105/1796523
		var updateScaleTranslate = function (scale, oldScale) {
			var scaleDifference = scale / oldScale;

			$scope.scaleTranslateX = scaleDifference * ($scope.scaleTranslateX - $scope.mouseX) + $scope.mouseX;
			$scope.scaleTranslateY = scaleDifference * ($scope.scaleTranslateY - $scope.mouseY) + $scope.mouseY;
		};

		var updateRelativeMouseX = function (mouseX) {
			$scope.relativeMouseX = (mouseX - $scope.scaleTranslateX) / $scope.scale - $scope.translateX;
		};

		var updateRelativeMouseY = function (mouseY) {
			$scope.relativeMouseY = (mouseY - $scope.scaleTranslateY) / $scope.scale - $scope.translateY;
		};

		var transform = function (e) {
			if (e.ctrlKey) {
				$scope.scale -= scaleStep * e.deltaY;
				e.preventDefault();
			} else {
				$scope.translateX -= e.deltaX / $scope.scale;
				$scope.translateY -= e.deltaY / $scope.scale;
				$scope.scale -= scaleStep * e.deltaZ;
			}
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { transform(e); });
		});

		$scope.$watch('scale', updateScaleTranslate);

		$scope.$watch('mouseX', updateRelativeMouseX);
		$scope.$watch('mouseY', updateRelativeMouseY);
	}
);