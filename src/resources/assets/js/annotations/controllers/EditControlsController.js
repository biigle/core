/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name EditControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar edit buttons
 */
angular.module('dias.annotations').controller('EditControlsController', function ($scope, mapAnnotations, keyboard, $timeout) {
		"use strict";

        // the user has a certain amount of time to quick delete the last drawn
        // annotation; this bool tells us whether the timeout is still running.
        var isInDeleteLastAnnotationTimeout = false;
        // time in ms in which the user is allowed to quick delete an annotation
        var deleteLastAnnotationTimeout = 10000;
        var timeoutPromise;

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.hasSelectedFeatures() && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        $scope.hasSelectedAnnotations = mapAnnotations.hasSelectedFeatures;

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

        $scope.canDeleteLastAnnotation = function () {
            return isInDeleteLastAnnotationTimeout && mapAnnotations.hasDrawnAnnotation();
        };

        $scope.deleteLastDrawnAnnotation = function () {
            if ($scope.canDeleteLastAnnotation()) {
                mapAnnotations.deleteLastDrawnAnnotation();
            }
        };

        $scope.isMoving = mapAnnotations.isMoving;

        // the quick delete timeout always starts when a new annotation was drawn
        $scope.$on('annotations.drawn', function (e, feature) {
            isInDeleteLastAnnotationTimeout = true;
            $timeout.cancel(timeoutPromise);
            timeoutPromise = $timeout(function () {
                isInDeleteLastAnnotationTimeout = false;
            }, deleteLastAnnotationTimeout);
        });

        // del key
        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });

        // esc key
        keyboard.on(27, function () {
            if ($scope.isMoving()) {
                $scope.$apply(finishMoving);
            }
        });

        // backspace key
        keyboard.on(8, function (e) {
            $scope.deleteLastDrawnAnnotation();
            $scope.$apply();
        });

        keyboard.on('m', function () {
            $scope.$apply($scope.moveSelectedAnnotations);
        });
	}
);
