/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, $attrs, images, urlParams) {
		"use strict";

		$scope.images = images;
		$scope.imageLoading = true;

		// state of the svg
		$scope.svg = {
			// the current scale of the elements
			scale: urlParams.get('s') || 1,
			// the current translation (position) of the elements
			// the values are stored negated to save the '-' in the URL
			// (because they are always/mostly negative)
			translateX: -urlParams.get('x') || 0,
			translateY: -urlParams.get('y') || 0,
			// mouse position taking zooming and translating into account
			mouseX: 0,
			mouseY: 0
		};

		var finishLoading = function () {
			$scope.imageLoading = false;
			urlParams.pushState($scope.images.currentImage._id);
		};

		var startLoading = function () {
			$scope.imageLoading = true;
		};

		$scope.nextImage = function () {
			startLoading();
			images.next().then(finishLoading);
		};

		$scope.prevImage = function () {
			startLoading();
			images.prev().then(finishLoading);
		};

		$scope.$watch('svg.scale', function (scale) {
			// scaling affects translate as well
			urlParams.set({
				s: scale,
				// make sure to store the negated values
				x: -$scope.svg.translateX,
				y: -$scope.svg.translateY
			});
		});

		$scope.$on('svg.panning.stop', function () {
			urlParams.set({
				// make sure to store the negated values
				x: -$scope.svg.translateX,
				y: -$scope.svg.translateY
			});
		});

		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId)).then(finishLoading);
	}
);