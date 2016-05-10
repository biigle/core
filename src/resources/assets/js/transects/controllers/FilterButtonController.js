/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterButtonController
 * @memberOf dias.transects
 * @description Controller for the filter menu button
 */
angular.module('dias.transects').controller('FilterButtonController', function ($scope, filter) {
	   "use strict";

        $scope.active = filter.hasRules;
    }
);
