/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name fallbackSrc
 * @memberOf dias.annotations
 * @description A lazy loading image
 */
angular.module('dias.annotations').directive('fallbackSrc', function () {
        "use strict";

        return {
            restrict: 'A',

            link: function (scope, element, attrs) {
                element[0].onerror = function () {
                    this.src = attrs.fallbackSrc;
                };
            }
        };
    }
);
