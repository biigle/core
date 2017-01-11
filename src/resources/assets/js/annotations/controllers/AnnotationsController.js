/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf biigle.annotations
 * @description Controller for the annotations list in the sidebar
 */
angular.module('biigle.annotations').controller('AnnotationsController', function ($scope, $element, annotations, mapAnnotations, $timeout) {
        "use strict";

        var scrollElement = $element[0];

        // list of all annotation list elements that are selected and should be visible
        var shouldBeVisible = [];

        var updateElementVisibility = function () {
            if (shouldBeVisible.length === 0) {
                return;
            }

            var scrollTop = scrollElement.scrollTop;
            var height = scrollElement.offsetHeight;
            var top = Infinity;
            var bottom = 0;
            var element;

            for (var i = shouldBeVisible.length - 1; i >= 0; i--) {
                element = shouldBeVisible[i];
                top = Math.min(element.offsetTop, top);
                bottom = Math.max(element.offsetTop + element.offsetHeight, bottom);
            }

            // scroll so all shouldBeVisible elements are visible or scroll to
            // the first element if all elements don't fit inside the scrollElement
            if (scrollTop > top) {
                scrollElement.scrollTop = top;
            } else if ((scrollTop + height) < bottom) {
                if (height >= (bottom - top)) {
                    scrollElement.scrollTop = bottom - scrollElement.offsetHeight;
                } else {
                    scrollElement.scrollTop = top;
                }
            }

        };

        $scope.shouldBeVisible = function (element) {
            if (shouldBeVisible.indexOf(element[0]) === -1) {
                shouldBeVisible.push(element[0]);
            }
        };

        $scope.shouldNotBeVisible = function (element) {
            var index = shouldBeVisible.indexOf(element[0]);
            if (index !== -1) {
                shouldBeVisible.splice(index, 1);
            }
        };

        $scope.keepElementPosition = function (element) {
            var positionBefore = element[0].offsetTop - scrollElement.scrollTop;
            // wait until everything is rendered
            $timeout(function () {
                var positionAfter = element[0].offsetTop - scrollElement.scrollTop;
                // scroll so the element has the same relative position than before
                scrollElement.scrollTop += positionAfter - positionBefore;
            });
        };

        $scope.getAnnotations = annotations.getGroupedByLabel;

        // only use automatic scrolling if the annotations were selected on the image,
        // not when they are selected in the sidebar
        mapAnnotations.onSelectedAnnotation(updateElementVisibility);
    }
);
