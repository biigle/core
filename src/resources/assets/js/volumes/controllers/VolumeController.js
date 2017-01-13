/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name VolumeController
 * @memberOf biigle.volumes
 * @description Controller for the volume view
 */
angular.module('biigle.volumes').controller('VolumeController', function ($scope) {
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
