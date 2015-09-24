/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.annotations
 * @description Controller for the sidebar
 */
angular.module('dias.annotations').controller('SidebarController', function ($scope, $rootScope, mapAnnotations) {
		"use strict";

        var foldoutStorageKey = 'dias.annotations.sidebar-foldout';

		// the currently opened sidebar-'extension' is remembered through localStorage
		$scope.foldout = window.localStorage[foldoutStorageKey] || '';
        if ($scope.foldout) {
            $rootScope.$broadcast('sidebar.foldout.open');
        }

		$scope.openFoldout = function (name) {
			$scope.foldout = window.localStorage[foldoutStorageKey] = name;
			$rootScope.$broadcast('sidebar.foldout.open');
		};

		$scope.closeFoldout = function () {
			$scope.foldout = window.localStorage[foldoutStorageKey] = '';
			$rootScope.$broadcast('sidebar.foldout.close');
		};

		$scope.toggleFoldout = function (name) {
			if ($scope.foldout === name) {
				$scope.closeFoldout();
			} else {
				$scope.openFoldout(name);
			}
		};

		$scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });

        $scope.$on('keypress', function (e, keyEvent) {
            switch (keyEvent.keyCode) {
                case 9:
                    keyEvent.preventDefault();
                    $scope.toggleFoldout('categories');
                    break;
                case 46:
                    $scope.deleteSelectedAnnotations();
                    break;
            }
        });
	}
);
