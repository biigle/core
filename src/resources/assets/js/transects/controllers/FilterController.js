/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.transects').controller('FilterController', function ($scope, images, TRANSECT_ID, TRANSECT_IMAGES, filter) {
		"use strict";

        $scope.data = {
            negate: 'false',
            filter: null,
            data: null
        };

        $scope.setFilterMode = function (mode) {
            filter.setMode(mode);
            images.updateFiltering();
        };

        $scope.isFilterMode = function (mode) {
            return filter.getMode() === mode;
        };

        $scope.getFilters = filter.getAll;

        $scope.addRule = function () {
            // don't simply pass the object on here because it will change in the future
            // the references e.g. to the original filter object should be left intact, though
            var rule = {
                filter: $scope.data.filter,
                negate: $scope.data.negate === 'true',
                data: $scope.data.data
            };

            // don't allow adding the same rule twice
            if (!filter.hasRule(rule)) {
                filter.addRule(rule).success(images.updateFiltering);
            }
        };

        $scope.getRules = filter.getAllRules;

        $scope.removeRule = function (rule) {
            filter.removeRule(rule);
            images.updateFiltering();
        };

        $scope.rulesLoading = filter.rulesLoading;

        $scope.numberImages = filter.getNumberImages;
	}
);
