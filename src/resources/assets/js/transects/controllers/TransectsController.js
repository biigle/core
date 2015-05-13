/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectsController
 * @memberOf dias.transects
 * @description Controller for managing the transects index page.
 */
angular.module('dias.transects').controller('TransectsController', function ($scope, $timeout) {
		"use strict";

		var activeButtonStorageKey = 'dias.transects.index.active.button';
		var prefix = '';
		var suffix = '';

		$scope.active = {
			image: '',
			button: ''
		};

		$scope.getImageUrl = function (id) {
			if (!prefix && !suffix) {
				return '#';
			}
			return prefix + '/' + id + '/' + suffix;
		};

		$scope.setImageUrl = function (p, s) {
			prefix = p;
			suffix = s;
		};

		$scope.imageSelected = function (e, id) {
			$scope.$broadcast('image.selected', e, id);
			$scope.active.image = id;
		};

		$scope.toggleButton = function (id) {
			if ($scope.active.button == id) {
				id = '';
			}
			$scope.active.button = id;
			$scope.$broadcast('button.setActive', id);
			window.localStorage.setItem(activeButtonStorageKey, id);
		};

		// default active button is image page button if none was set in 
		// localStorage
		// $scope.toggleButton(window.localStorage.getItem(activeButtonStorageKey) ||	'image-page-button');
		$timeout(function () {
			var id = window.localStorage.getItem(activeButtonStorageKey);
			$scope.toggleButton(id === null ? 'image-page-button' : id);
		});
	}
);