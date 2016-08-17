/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AteExamplePatchesSettingsController
 * @memberOf dias.annotations
 * @description Controller for ATE example patches settings
 */
angular.module('dias.annotations').controller('AteExamplePatchesSettingsController', function ($scope, exampleAnnotations, settings) {
		"use strict";

        var key = 'exampleAnnotations';

        settings.setDefaultSettings(key, true);

        $scope.show = function () {
            settings.setPermanentSettings(key, true);
        };

        $scope.hide = function () {
            settings.setPermanentSettings(key, false);
        };

        $scope.shown = function () {
            return settings.getPermanentSettings(key);
        };

        $scope.$watch($scope.shown, function (shown) {
            if (shown) {
                exampleAnnotations.enable();
            } else {
                exampleAnnotations.disable();
            }
        });
	}
);
