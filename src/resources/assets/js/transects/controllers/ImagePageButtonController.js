/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagePageButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image index page when clicking on an image of the transects view.
 */
angular.module('dias.transects').controller('ImagePageButtonController', function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.imageUrl + '/';
		var suffix = '';
		var id = 'image-page-button';

		$scope.selected = false;

		$scope.activate = function () {
			$scope.toggleButton(id);
		};

		$scope.$on('button.setActive', function (e, buttonId) {
			$scope.selected = id === buttonId;
			if ($scope.selected) {
				$scope.setImageUrl(prefix, suffix);
			}
		});
	}
);