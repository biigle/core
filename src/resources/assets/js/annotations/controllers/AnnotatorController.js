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

		$scope.viewport = {
			zoom: urlParams.get('z') || 1,
			center: [urlParams.get('x') || 0, urlParams.get('y') || 0]
		};

		var finishLoading = function () {
			$scope.imageLoading = false;
			var image = $scope.images.currentImage;
			urlParams.pushState(image._id);
			$scope.$broadcast('image.shown', image);
		};

		var startLoading = function () {
			$scope.imageLoading = true;
		};

		var showImage = function (id) {
			images.show(parseInt(id)).then(finishLoading);
		};

		$scope.nextImage = function () {
			startLoading();
			images.next().then(finishLoading);
		};

		$scope.prevImage = function () {
			startLoading();
			images.prev().then(finishLoading);
		};

		$scope.$on('canvas.moveend', function(e, params) {
			$scope.viewport.zoom = params.zoom;
			$scope.viewport.center[0] = Math.round(params.center[0]);
			$scope.viewport.center[1] = Math.round(params.center[1]);
			urlParams.set({
				z: $scope.viewport.zoom,
				x: $scope.viewport.center[0],
				y: $scope.viewport.center[1]
			});
		});

		images.init($attrs.transectId);
		showImage($attrs.imageId);
	}
);