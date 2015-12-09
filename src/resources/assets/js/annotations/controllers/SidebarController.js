/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.annotations
 * @description Controller for the sidebar
 */
angular.module('dias.annotations').controller('SidebarController', function ($scope, $rootScope, mapAnnotations, REMEMBER_FOLDOUTS) {
		"use strict";

        var foldoutStorageKey = 'dias.annotations.sidebar-foldout';

        $scope.foldout = '';

		$scope.openFoldout = function (name) {
            // only permanently store the state if it should be remembered
            if (REMEMBER_FOLDOUTS.indexOf(name) >= 0) {
                window.localStorage[foldoutStorageKey] = name;
            } else {
                window.localStorage.removeItem(foldoutStorageKey);
            }
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

        // the currently opened sidebar-'extension' is remembered through localStorage
        if (window.localStorage[foldoutStorageKey]) {
            $scope.openFoldout(window.localStorage[foldoutStorageKey]);
        }
	}
);
