/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name FiltersControlController
 * @memberOf dias.annotations
 * @description Controller for the sidebar filters foldout button
 */
angular.module('dias.annotations').controller('FiltersControlController', function ($scope, mapImage) {
        "use strict";

        $scope.supportsFilters = mapImage.supportsFilters;
    }
);
