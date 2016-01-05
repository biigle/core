/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsFilterCntroller
 * @memberOf dias.transects
 * @description Controller for the annotations filter mixin
 */
angular.module('dias.transects').controller('AnnotationsFilterController', function ($scope, images, flags) {
        "use strict";

        var flagId = 'has-annotation';

        $scope.toggleFilter = function () {
            images.toggleFilter(flagId);
        };

        $scope.toggleNegateFilter = function () {
            images.toggleNegateFilter(flagId);
        };

        $scope.flag = flags.list[flagId];
    }
);
