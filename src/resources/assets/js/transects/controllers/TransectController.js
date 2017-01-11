/**
 * @namespace biigle.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf biigle.transects
 * @description Controller for the transect view
 */
angular.module('biigle.transects').controller('TransectController', function ($scope) {
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
