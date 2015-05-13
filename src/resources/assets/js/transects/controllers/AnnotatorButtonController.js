/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotatorButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image annotator when clicking on an image of the transects view.
 */
try {
angular.module('dias.transects').controller('AnnotatorButtonController', function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.annotatorUrl + '/';
		var suffix = '';
		var id = 'image-annotator-button';

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
} catch (e) {
	// dias.transects is not loaded on this page
}