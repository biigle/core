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

		$scope.openFoldout = function (name) {
			$scope.foldout = name;
			$rootScope.$broadcast('sidebar.foldout.open');
		};

		$scope.closeFoldout = function () {
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
            if (keyEvent.keyCode === 46) {
                $scope.deleteSelectedAnnotations();
            }
        });
	}
);
