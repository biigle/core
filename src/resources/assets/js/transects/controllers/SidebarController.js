/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.transects
 * @description Controller for the sidebar of the transects index page.
 */
angular.module('dias.transects').controller('SidebarController', function ($scope, Image, $attrs) {
		"use strict";

		$scope.exifKeys = $attrs.exifKeys.split(',');

		var handleImageClick = function (angularEvent, clickEvent, imageId) {
			if ($scope.active.button) return;

			clickEvent.preventDefault();
			$scope.imageData = Image.get({id: imageId});
		};

		$scope.$on('image.selected', handleImageClick);
	}
);