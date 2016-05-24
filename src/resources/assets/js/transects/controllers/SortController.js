/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortController
 * @memberOf dias.transects
 * @description Controller for the sorting feature of the transects page
 */
angular.module('dias.transects').controller('SortController', function ($scope, sort, images) {
        "use strict";

        // the cache can be used by sort controllers to cache their sorting sequences
        // so they don't have to be reloaded each time the popover is closed and opened
        // again
        var cache = {};

        var loading = false;

        $scope.setCache = function (key, value) {
            cache[key] = value;
        };

        $scope.getCache = function (key) {
            return cache[key];
        };

        $scope.hasCache = function (key) {
            return cache.hasOwnProperty(key);
        };

        $scope.active = sort.isActive;

        $scope.setSortAscending = function () {
            sort.setAscending();
            images.updateSorting();
        };

        $scope.setSortDescending = function () {
            sort.setDescending();
            images.updateSorting();
        };

        $scope.isSortAscending = sort.isAscending;
        $scope.isSortDescending = sort.isDescending;

        $scope.activateSorter = function (id, sequence) {
            sort.activateSorter(id, sequence);
            images.updateSorting();
        };

        $scope.resetSorting = function () {
            sort.resetSorting();
        };

        $scope.setLoading = function (l) {
            loading = l;
        };

        $scope.isLoading = function () {
            return loading;
        };
    }
);
