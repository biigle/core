/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', function ($scope, $element, images, filter, keyboard) {
		"use strict";

        var updateDisplay = function () {
            images.updateGrid($element[0].clientWidth, $element[0].clientHeight);
        };

        $scope.imageHasFlag = filter.hasFlag;


        $scope.getImageIds = images.getSequence;

        $element.bind('wheel', function (e) {
            images.scrollRows((e.deltaY >= 0) ? 1 : -1);
            $scope.$apply();
        });

        // arrow up
        keyboard.on(38, function () {
            images.scrollRows(-1);
            $scope.$apply();
        });

        // arrow down
        keyboard.on(40, function () {
            images.scrollRows(1);
            $scope.$apply();
        });

        // arrow left
        keyboard.on(37, function () {
            images.scrollRows(-1 * images.getRows());
            $scope.$apply();
        });

        // arrow right
        keyboard.on(39, function () {
            images.scrollRows(images.getRows());
            $scope.$apply();
        });

        window.addEventListener('resize', function () {
            $scope.$apply(updateDisplay);
        });
        updateDisplay();
	}
);
