/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name SidebarController
 * @memberOf biigle.annotations
 * @description Controller for the sidebar
 */
angular.module('biigle.annotations').controller('SidebarController', function ($scope, $rootScope) {
		"use strict";

        var foldoutStorageKey = 'biigle.annotations.sidebar-foldout';

        var annotationFilterOpen = false;

        $scope.toggleAnnotationFilter = function () {
            annotationFilterOpen = !annotationFilterOpen;
        };

        $scope.isAnnotationFilterOpen = function () {
            return annotationFilterOpen;
        };

        $scope.foldout = '';

		$scope.openFoldout = function (name) {
            window.localStorage[foldoutStorageKey] = name;
            $scope.foldout = name;
			$rootScope.$broadcast('sidebar.foldout.open', name);
		};

		$scope.closeFoldout = function () {
            window.localStorage.removeItem(foldoutStorageKey);
			$scope.foldout = '';
			$rootScope.$broadcast('sidebar.foldout.close');
		};

		$scope.toggleFoldout = function (name) {
			if ($scope.foldout === name) {
				$scope.closeFoldout();
			} else {
				$scope.openFoldout(name);
			}
		};

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });

        // the currently opened sidebar-'extension' is remembered through localStorage
        if (window.localStorage[foldoutStorageKey]) {
            $scope.openFoldout(window.localStorage[foldoutStorageKey]);
        }
	}
);
