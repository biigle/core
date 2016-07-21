/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.annotations
 * @description Controller for the annotations list in the sidebar
 */
angular.module('dias.annotations').controller('AnnotationsController', function ($scope, $element, annotations) {
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

        $scope.scrollToElement = function (element) {
            if (shouldBeVisible.indexOf(element[0]) === -1) {
                shouldBeVisible.push(element[0]);
                updateElementVisibility();
            }
        };

        $scope.dontScrollToElement = function (element) {
            var index = shouldBeVisible.indexOf(element[0]);
            if (index !== -1) {
                shouldBeVisible.splice(index, 1);
            }
        };

        $scope.getAnnotations = annotations.getGroupedByLabel;
    }
);
