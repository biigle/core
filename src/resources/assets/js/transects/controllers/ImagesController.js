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

        var scrollRows = function (rows) {
            images.scrollRows(rows);
            $scope.$apply();
        };

        var scrollToPercent = function (percent) {
            images.scrollToPercent(percent);
            $scope.$apply();
        };

        $scope.imageHasFlag = filter.hasFlag;

        $scope.getImageIds = images.getSequence;

        $element.bind('wheel', function (e) {
            scrollRows((e.deltaY >= 0) ? 1 : -1);
        });

        // arrow up
        keyboard.on(38, function () {
            scrollRows(-1);
        });

        // arrow down
        keyboard.on(40, function () {
            scrollRows(1);
        });

        var prevPage = function () {
            scrollRows(-1 * images.getRows());
        };

        // arrow left
        keyboard.on(37, prevPage);
        // page up
        keyboard.on(33, prevPage);

        var nextPage = function () {
            scrollRows(images.getRows());
        };

        // arrow right
        keyboard.on(39, nextPage);
        // page down
        keyboard.on(34, nextPage);

        // home
        keyboard.on(36, function () {
            scrollToPercent(0);
        });

        // end
        keyboard.on(35, function () {
            scrollToPercent(1);
        });

        window.addEventListener('resize', function () {
            $scope.$apply(updateDisplay);
        });
        updateDisplay();
        // initialize service after setting the grid
        images.initialize();
	}
);
