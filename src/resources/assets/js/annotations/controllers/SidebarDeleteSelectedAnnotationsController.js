/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarDeleteSelectedAnnotationsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar category foldout button
 */
angular.module('dias.annotations').controller('SidebarDeleteSelectedAnnotationsController', function ($scope, keyboard, mapAnnotations) {
		"use strict";

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });
	}
);
