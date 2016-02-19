/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name EditControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar edit buttons
 */
angular.module('dias.annotations').controller('EditControlsController', function ($scope, mapAnnotations, keyboard) {
		"use strict";

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        var startMoving = function () {
            mapAnnotations.startMoving();
        };

        var finishMoving = function () {
            mapAnnotations.finishMoving();
        };

        $scope.moveSelectedAnnotations = function () {
            if ($scope.isMoving()) {
                finishMoving();
            } else {
                startMoving();
            }
        };

        $scope.isMoving = mapAnnotations.isMoving;

        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });

        keyboard.on(27, function () {
            if ($scope.isMoving()) {
                $scope.$apply(finishMoving);
            }
        });

        keyboard.on('m', function () {
            $scope.$apply($scope.moveSelectedAnnotations);
        });
	}
);
