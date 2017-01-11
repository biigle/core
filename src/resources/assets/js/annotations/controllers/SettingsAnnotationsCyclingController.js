/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name SettingsAnnotationsCyclingController
 * @memberOf biigle.annotations
 * @description Controller cycling through annotations
 */
angular.module('biigle.annotations').controller('SettingsAnnotationsCyclingController', function ($scope, mapAnnotations, annotations, labels, keyboard, settings, EDIT_MODE) {
        "use strict";

        // flag to prevent cycling while a new image is loading
        var loading = false;
        // identifier for this cycling variant (there are others, too)
        var cyclingKey = 'annotations';

        var nextAnnotation = function (e) {
            if (loading || !$scope.cycling()) return;

            if (mapAnnotations.hasNext()) {
                mapAnnotations.cycleNext();
            } else {
                // method from AnnotatorController; mapAnnotations will refresh automatically
                $scope.nextImage().then(mapAnnotations.jumpToFirst);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var prevAnnotation = function (e) {
            if (loading || !$scope.cycling()) return;

            if (mapAnnotations.hasPrevious()) {
                mapAnnotations.cyclePrevious();
            } else {
                // method from AnnotatorController; mapAnnotations will refresh automatically
                $scope.prevImage().then(mapAnnotations.jumpToLast);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var attachLabel = function (e) {
            if (loading || !EDIT_MODE) return;
            if (e) {
                e.preventDefault();
            }

            if ($scope.cycling() && labels.hasSelected()) {
                annotations.attachAnnotationLabel(mapAnnotations.getCurrent()).$promise.then(function () {
                    mapAnnotations.flicker(1);
                });
            } else {
                mapAnnotations.flicker();
            }
        };

        // stop cycling using a keyboard event
        var stopCycling = function (e) {
            e.preventDefault();
            $scope.stopCycling();
            $scope.$apply();
            return false;
        };

        $scope.attributes = {
            // restrict cycling of annotations to the currently selected label category
            restrict: false
        };

        $scope.cycling = function () {
            return settings.getVolatileSettings('cycle') === cyclingKey;
        };

        $scope.startCycling = function () {
            settings.setVolatileSettings('cycle', cyclingKey);
        };

        $scope.stopCycling = function () {
            settings.setVolatileSettings('cycle', '');
        };

        $scope.$watch($scope.cycling, function (cycling) {
            if (cycling) {
                // override previous image on arrow left
                keyboard.on(37, prevAnnotation, 10);
                // override next image on arrow right and space
                keyboard.on(39, nextAnnotation, 10);
                keyboard.on(32, nextAnnotation, 10);

                keyboard.on(13, attachLabel, 10);
                keyboard.on(27, stopCycling, 10);
                mapAnnotations.jumpToCurrent();
                // if the displayed annotations change (due to filtering etc),
                // jump to the first annotation again
                annotations.observeFilter(mapAnnotations.jumpToFirst);
            } else {
                keyboard.off(37, prevAnnotation);
                keyboard.off(39, nextAnnotation);
                keyboard.off(32, nextAnnotation);
                keyboard.off(13, attachLabel);
                keyboard.off(27, stopCycling);
                mapAnnotations.clearSelection();
                annotations.unobserveFilter(mapAnnotations.jumpToFirst);
            }
        });

        $scope.$on('image.shown', function () {
            loading = false;
        });

        $scope.prevAnnotation = prevAnnotation;
        $scope.nextAnnotation = nextAnnotation;
        $scope.attachLabel = attachLabel;
    }
);
