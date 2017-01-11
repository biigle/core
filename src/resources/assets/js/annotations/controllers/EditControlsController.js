/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name EditControlsController
 * @memberOf biigle.annotations
 * @description Controller for the controls bar edit buttons
 */
angular.module('biigle.annotations').controller('EditControlsController', function ($scope, mapAnnotations, keyboard, $timeout, labels, msg, mapInteractions) {
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
            mapInteractions.activate('translate');
        };

        var finishMoving = function () {
            mapInteractions.deactivate('translate');
        };

        var startAttaching = function () {
            mapInteractions.activate('attachLabel');
        };

        var finishAttaching = function () {
            mapInteractions.deactivate('attachLabel');
        };

        $scope.toggleMoving = function (e) {
            if ($scope.isMoving()) {
                finishMoving();
            } else {
                // Remove focus of the button so the keyboard events of the translate
                // interaction workright away. The keyboard events only work if the
                // event target is the body.
                if (e && e.target) {
                    e.target.blur();
                }
                startMoving();
            }
        };

        $scope.toggleAttaching = function () {
            if ($scope.isAttaching()) {
                finishAttaching();
            } else if (labels.hasSelected()) {
                startAttaching();
            } else {
                $scope.$emit('sidebar.foldout.do-open', 'categories');
                msg.info('Please select a label to attach to the annotations.');
            }
        };

        $scope.canDeleteLastAnnotation = function () {
            return isInDeleteLastAnnotationTimeout && mapAnnotations.hasDrawnAnnotation();
        };

        $scope.deleteLastDrawnAnnotation = function () {
            mapAnnotations.deleteLastDrawnAnnotation();
        };

        $scope.isMoving = function () {
            return mapInteractions.active('translate');
        };

        $scope.isAttaching = function () {
            return mapInteractions.active('attachLabel');
        };

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
            if ($scope.canDeleteLastAnnotation()) {
                e.preventDefault();
                $scope.deleteLastDrawnAnnotation();
                $scope.$apply();
            }
        });

        keyboard.on('m', function () {
            $scope.$apply($scope.toggleMoving);
        });

        keyboard.on('l', function () {
            $scope.$apply($scope.toggleAttaching);
        });
	}
);
