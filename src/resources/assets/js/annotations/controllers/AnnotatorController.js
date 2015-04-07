/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, $element, $attrs, images) {
		"use strict";

		$scope.images = images.buffer;
		$scope.imageLoading = true;

		var finishLoading = function () {
			$scope.imageLoading = false;
		};

		var startLoading = function () {
			$scope.imageLoading = true;
		};

		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId)).then(finishLoading);

		// state of the svg
		$scope.svg = {
			// the current scale of the elements
			scale: 1,
			// the current translation (position) of the elements
			translateX: 0,
			translateY: 0,
			// mouse position taking zooming and translating into account
			mouseX: 0,
			mouseY: 0
		};

		$scope.nextImage = function () {
			startLoading();
			images.next().then(finishLoading);
		};

		$scope.prevImage = function () {
			startLoading();
			images.prev().then(finishLoading);
		};
	}
);