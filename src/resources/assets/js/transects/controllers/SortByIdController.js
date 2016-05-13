/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortByIdController
 * @memberOf dias.transects
 * @description Controller for sorting images by ID on the transects overview page
 */
angular.module('dias.transects').controller('SortByIdController', function ($scope, sort, TRANSECT_IMAGES) {
        "use strict";

        var id = 'id';

        $scope.active = function () {
            return sort.isSorterActive('id');
        };

        $scope.toggle = function () {
            if ($scope.active()) return;

            $scope.activateSorter(id, TRANSECT_IMAGES);
        };
    }
);
