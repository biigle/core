/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.annotations
 * @description Controller for the sidebar
 */
angular.module('dias.annotations').controller('SidebarController', function ($scope, $rootScope, mapAnnotations) {
		"use strict";

		// the currently opened sidebar-'extension'
		$scope.foldout = '';

		$scope.toggleFoldout = function(name) {
			if ($scope.foldout === name) {
				$scope.foldout = '';
			} else {
				$scope.foldout = name;
			}

			$rootScope.$broadcast('sidebar.foldout.toggle');
		};

		$scope.deleteSelectedAnnotations = mapAnnotations.deleteSelected;
	}
);