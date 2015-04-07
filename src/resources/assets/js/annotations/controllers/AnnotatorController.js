/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, $attrs, images) {
		"use strict";

		$scope.images = images;
		$scope.imageLoading = true;

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

		var finishLoading = function () {
			$scope.imageLoading = false;
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

		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId)).then(finishLoading);
	}
);