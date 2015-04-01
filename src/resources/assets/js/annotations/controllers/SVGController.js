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

		var updateScaleTranslate = function (scale) {
			scaleTmp = 1 - scale;
			//TODO still jumps around while zooming, don't know why
			$scope.scaleTranslateX = $scope.relativeMouseX * scaleTmp;
			$scope.scaleTranslateY = $scope.relativeMouseY * scaleTmp;
		};

		var updateRelativeMouseX = function (mouseX) {
			$scope.relativeMouseX = (mouseX - $scope.scaleTranslateX) / $scope.scale - $scope.translateX;
		};

		var updateRelativeMouseY = function (mouseY) {
			$scope.relativeMouseY = (mouseY - $scope.scaleTranslateY) / $scope.scale - $scope.translateY;
		};

		var transform = function (e) {
			if (e.ctrlKey) {
				$scope.scale += scaleStep * e.deltaY;
				e.preventDefault();
			} else {
				$scope.translateX -= e.deltaX / $scope.scale;
				$scope.translateY -= e.deltaY / $scope.scale;
				$scope.scale += scaleStep * e.deltaZ;
			}
		};

		$element.on('wheel', function (e) {
			$scope.$apply(function () { transform(e); });
		});

		// scale around the cursor
		// see http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Transforming_the_Coordinate_System#Technique:_Scaling_Around_a_Center_Point
		$scope.$watch('scale', updateScaleTranslate);

		$scope.$watch('mouseX', updateRelativeMouseX);
		$scope.$watch('mouseY', updateRelativeMouseY);
	}
);