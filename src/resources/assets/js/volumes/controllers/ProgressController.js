/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name ProgressController
 * @memberOf biigle.volumes
 * @description Controller for the progress bar
 */
angular.module('biigle.volumes').controller('ProgressController', function ($scope, images, debounce) {
		"use strict";

        var scrolling = false;
        var rect;

        var scroll = function (e) {
            e.preventDefault();
            rect = e.target.getBoundingClientRect();
            images.scrollToPercent((e.clientY - rect.top) / rect.height);
        };

        $scope.beginScrolling = function () {
            scrolling = true;
        };

        $scope.stopScrolling = function (e) {
            $scope.scroll(e);
            scrolling = false;
        };

        $scope.scroll = function (e) {
            if (scrolling) {
                // throttle the amount of scrolling actions because the scroll event
                // might be fired very frequently
                debounce(function () {scroll(e);}, 25, 'volumes.progress.scroll');
            }
        };

        $scope.progress = function () {
            return images.progress() * 100 + '%';
        };

        $scope.top = function () {
            images.scrollToPercent(0);
        };

        $scope.prevPage = function () {
            images.scrollRows(-1 * images.getRows());
        };

        $scope.prevRow = function () {
            images.scrollRows(-1);
        };

        $scope.nextRow = function () {
            images.scrollRows(1);
        };

        $scope.nextPage = function () {
            images.scrollRows(images.getRows());
        };

        $scope.bottom = function () {
            images.scrollToPercent(1);
        };

        $scope.isAtTop = function () {
            return images.progress() === 0;
        };

        $scope.isAtBottom = function () {
            return images.progress() === 1;
        };
	}
);
