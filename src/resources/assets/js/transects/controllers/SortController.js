/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortController
 * @memberOf dias.transects
 * @description Controller for the sorting feature of the transects page
 */
angular.module('dias.transects').controller('SortController', function ($scope, sort, images) {
        "use strict";

        $scope.active = sort.isActive;

        $scope.setSortAscending = function () {
            sort.setAscending();
            images.updateSequence();
        };

        $scope.setSortDescending = function () {
            sort.setDescending();
            images.updateSequence();
        };

        $scope.isSortAscending = sort.isAscending;
        $scope.isSortDescending = sort.isDescending;

        $scope.activateSorter = function (id, sequence) {
            sort.activateSorter(id, sequence);
            images.updateSequence();
        };

        $scope.resetSorting = function () {
            sort.resetSorting();
        };
    }
);
