/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ColorAdjustmentController
 * @memberOf dias.annotations
 * @description Controller for the sidebar color adjustment foldout
 */
angular.module('dias.annotations').controller('ColorAdjustmentController', function ($scope, debounce, mapImage) {
        "use strict";

        var storageKey = 'dias.annotations.color-adjustment';

        var brightnessRgbActive = false;

        var DEFAULT_ADJUSTMENT = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        $scope.colorAdjustment = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        var render = function () {
            mapImage.colorAdjustment($scope.colorAdjustment);
        };

        $scope.reset = function (key, index) {
            if (key === undefined) {
                $scope.colorAdjustment = angular.copy(DEFAULT_ADJUSTMENT);
                render();
            } else if (DEFAULT_ADJUSTMENT.hasOwnProperty(key)) {
                $scope.colorAdjustment[key][index] = DEFAULT_ADJUSTMENT[key][index];
                render();
            }
        };

        $scope.toggleBrightnessRGB = function () {
            if (brightnessRgbActive) {
                $scope.colorAdjustment.brightnessRGB = angular.copy(DEFAULT_ADJUSTMENT.brightnessRGB);
            } else {
                $scope.colorAdjustment.brightnessContrast[0] = DEFAULT_ADJUSTMENT.brightnessContrast[0];
            }
            brightnessRgbActive = !brightnessRgbActive;
            render();
        };

        $scope.isBrightnessRgbActive = function () {
            return brightnessRgbActive;
        };

        $scope.$watch('colorAdjustment', function () {
            debounce(render, 100, storageKey);
        }, true);
    }
);
