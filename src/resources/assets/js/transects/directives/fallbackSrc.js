/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name fallbackSrc
 * @memberOf dias.transects
 * @description A lazy loading image
 */
angular.module('dias.transects').directive('fallbackSrc', function () {
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
