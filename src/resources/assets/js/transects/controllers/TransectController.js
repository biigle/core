/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Controller for the transect view
 */
angular.module('dias.transects').controller('TransectController', function ($scope) {
		"use strict";

        var labelMode = false;

        $scope.isInLabelMode = function () {
            return labelMode;
        };

        $scope.toggleLabelMode = function () {
            labelMode = !labelMode;
            $scope.$broadcast('label-mode.toggle', labelMode);
        };
	}
);
