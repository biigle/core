/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', function ($scope, TransectImage, $attrs, $element, $timeout) {
		"use strict";

		var element = $element[0];
		var boundingRect, timeoutPromise;
		// add this much images for each step
		var step = 20;
		// offset of the element bottom to the window lower bound in pixels at 
		// which a new bunch of images should be displayed
		var newStepOffset = 100;

		var needsNewStep = function () {
			boundingRect = element.getBoundingClientRect();
			return boundingRect.bottom <= window.innerHeight + newStepOffset;
		};

		var checkLowerBound = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				timeoutPromise = $timeout(initialize, 50);
			} else {
				// viewport is full, now switch to event listeners for loading
				$timeout.cancel(timeoutPromise);
				window.addEventListener('scroll', checkLowerBound);
				window.addEventListener('resize', checkLowerBound);
			}
		};

		// array of all image ids of this transect
		$scope.images = TransectImage.query({transect_id: $attrs.transectId});
		// url prefix for the image index page
		$scope.imageUrl = $attrs.imageUrl;
		// url prefix for the image api endpoint
		$scope.apiUrl = $attrs.apiUrl;
		// number of currently shown images
		$scope.limit = 20;

		initialize();
	}
);