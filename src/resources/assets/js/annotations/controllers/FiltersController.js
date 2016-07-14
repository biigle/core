/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name FiltersController
 * @memberOf dias.annotations
 * @description Controller for the sidebar filters foldout
 */
angular.module('dias.annotations').controller('FiltersController', function ($scope, debounce, mapImage) {
        "use strict";

        var storageKey = 'dias.annotations.filter';

        var brightnessRgbActive = false;

        var DEFAULT_FILTERS = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        $scope.filters = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        var render = function () {
            mapImage.filter($scope.filters);
        };

        $scope.reset = function (key, index) {
            if (key === undefined) {
                $scope.filters = angular.copy(DEFAULT_FILTERS);
                render();
            } else if (DEFAULT_FILTERS.hasOwnProperty(key)) {
                $scope.filters[key][index] = DEFAULT_FILTERS[key][index];
                render();
            }
        };

        $scope.toggleBrightnessRGB = function () {
            if (brightnessRgbActive) {
                $scope.filters.brightnessRGB = angular.copy(DEFAULT_FILTERS.brightnessRGB);
            } else {
                $scope.filters.brightnessContrast[0] = DEFAULT_FILTERS.brightnessContrast[0];
            }
            brightnessRgbActive = !brightnessRgbActive;
            render();
        };

        $scope.isBrightnessRgbActive = function () {
            return brightnessRgbActive;
        };

        $scope.$watch('filters', function (filters) {
            debounce(render, 100, storageKey);
        }, true);
    }
);
