/**
 * @namespace dias.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf dias.ate
 * @description Controller for the transect view
 */
angular.module('dias.ate').controller('AteController', function ($scope) {
		"use strict";

        var labelMode = true;

        $scope.isInLabelMode = function () {
            return labelMode;
        };

        // $scope.toggleLabelMode = function () {
        //     labelMode = !labelMode;
        //     $scope.$broadcast('label-mode.toggle', labelMode);
        // };
	}
);
