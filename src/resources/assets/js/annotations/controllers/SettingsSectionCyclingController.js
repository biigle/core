/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name SettingsSectionCyclingController
 * @memberOf biigle.annotations
 * @description Controller for cycling through image sections
 */
angular.module('biigle.annotations').controller('SettingsSectionCyclingController', function ($scope, map, mapImage, keyboard, settings) {
        "use strict";

        // flag to prevent cycling while a new image is loading
        var loading = false;

        var cyclingKey = 'sections';
        var view = map.getView();

        // view center point of the start position
        var startCenter = [0, 0];
        // number of pixels to proceed in x and y direction for each step
        var stepSize = [0, 0];
        // number of steps in x and y direction -1!
        var stepCount = [0, 0];
        // number of current step in x and y direction -1!
        var currentStep = [0, 0];

        // TODO react on window resize events and foldout open as well as
        // changing the zoom level

        var distance = function (p1, p2) {
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };

        // if the map size was changed, this function finds the next nearest step
        var findNearestStep = function (center) {
            var nearest = Infinity;
            var current = 0;
            var nearestStep = [0, 0];
            for (var y = 0; y <= stepCount[1]; y++) {
                for (var x = 0; x <= stepCount[0]; x++) {
                    current = distance(center, getStepPosition([x, y]));
                    if (current < nearest) {
                        nearestStep[0] = x;
                        nearestStep[1] = y;
                        nearest = current;
                    }
                }
            }

            return nearestStep;
        };

        // (re-)calculate all needed positions and sizes for cycling through sections
        var updateExtent = function () {
            view = map.getView();
            // set the event listener here in case the view changed
            view.on('change:resolution', handleUserZoom);
            var imageExtent = mapImage.getExtent();
            var viewExtent = view.calculateExtent(map.getSize());

            stepSize[0] = viewExtent[2] - viewExtent[0];
            stepSize[1] = viewExtent[3] - viewExtent[1];

            // set the start center before adjusting the step size with overlap
            startCenter[0] = stepSize[0] / 2;
            startCenter[1] = stepSize[1] / 2;

            // Math.ceil(4.0) - 1 is NOT equivalent to Math.floor(4.0)!
            // - 1 because stepCount begins with 0 so a stepCount of 1 means 2 steps
            stepCount[0] = Math.ceil(imageExtent[2] / stepSize[0]) - 1;
            stepCount[1] = Math.ceil(imageExtent[3] / stepSize[1]) - 1;

            var overlap;
            if (stepCount[0] > 0) {
                // make the sections overlap horizonally so they exactly cover the image
                overlap = (stepSize[0] * (stepCount[0] + 1)) - imageExtent[2];
                stepSize[0] -= overlap / stepCount[0];
            } else {
                stepSize[0] = viewExtent[2];
                // update the start point so the image is centered horizontally
                startCenter[0] = imageExtent[2] / 2;
            }

            if (stepCount[1] > 0) {
                // make the sections overlap vertically so they exactly cover the image
                overlap = (stepSize[1] * (stepCount[1] + 1)) - imageExtent[3];
                stepSize[1] -= overlap / stepCount[1];
            } else {
                stepSize[1] = viewExtent[3];
                // update the start point so the image is centered vertically
                startCenter[1] = imageExtent[3] / 2;
            }
        };

        var handleUserZoom = function () {
            updateExtent();
            // allow the user to pan but go back to the regular prev/next step when they
            // want to continue cycling, not to the currently nearest step
            var step = findNearestStep(getStepPosition(currentStep));
            currentStep[0] = step[0];
            currentStep[1] = step[1];
        };

        var handleMapResize = function () {
            updateExtent();
            goToStep(findNearestStep(view.getCenter()));
        };

        var goToStartStep = function () {
            goToStep([0, 0]);
        };

        var goToEndStep = function () {
            goToStep(stepCount);
        };

        var getStepPosition = function (step) {
            return [
                step[0] * stepSize[0] + startCenter[0],
                step[1] * stepSize[1] + startCenter[1],
            ];
        };

        var goToStep = function (step) {
            // animate stepping
            // var pan = ol.animation.pan({
            //     source: view.getCenter(),
            //     duration: 500
            // });
            // map.beforeRender(pan);
            currentStep[0] = step[0];
            currentStep[1] = step[1];
            view.setCenter(getStepPosition(currentStep));
        };

        var nextStep = function () {
            if (currentStep[0] < stepCount[0]) {
                return [currentStep[0] + 1, currentStep[1]];
            } else {
                return [0, currentStep[1] + 1];
            }
        };

        var prevStep = function () {
            if (currentStep[0] > 0) {
                return [currentStep[0] - 1, currentStep[1]];
            } else {
                return [stepCount[0], currentStep[1] - 1];
            }
        };

        var nextSection = function (e) {
            if (loading || !$scope.cycling()) return;

            if (currentStep[0] < stepCount[0] || currentStep[1] < stepCount[1]) {
                goToStep(nextStep());
            } else {
                $scope.nextImage().then(updateExtent).then(goToStartStep);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var prevSection = function (e) {
            if (loading || !$scope.cycling()) return;

            if (currentStep[0] > 0 || currentStep[1] > 0) {
                goToStep(prevStep());
            } else {
                $scope.prevImage().then(updateExtent).then(goToEndStep);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        // stop cycling using a keyboard event
        var stopCycling = function (e) {
            e.preventDefault();
            $scope.stopCycling();
            $scope.$apply();
            return false;
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
                map.on('change:size', handleMapResize);
                updateExtent();
                goToStartStep();
                // override previous image on arrow left
                keyboard.on(37, prevSection, 10);
                // override next image on arrow right and space
                keyboard.on(39, nextSection, 10);
                keyboard.on(32, nextSection, 10);

                keyboard.on(27, stopCycling, 10);
            } else {
                map.un('change:size', handleMapResize);
                view.un('change:resolution', handleUserZoom);
                keyboard.off(37, prevSection);
                keyboard.off(39, nextSection);
                keyboard.off(32, nextSection);
                keyboard.off(27, stopCycling);
            }
        });

        $scope.$on('image.shown', function () {
            loading = false;
        });

        $scope.prevSection = prevSection;
        $scope.nextSection = nextSection;
    }
);

