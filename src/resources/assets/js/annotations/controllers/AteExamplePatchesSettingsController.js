/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AteExamplePatchesSettingsController
 * @memberOf dias.annotations
 * @description Controller for ATE example patches settings
 */
angular.module('dias.annotations').controller('AteExamplePatchesSettingsController', function ($scope, exampleAnnotations) {
		"use strict";

        $scope.setDefaultSettings('exampleAnnotations', true);

        $scope.show = function () {
            $scope.setSettings('exampleAnnotations', true);
        };

        $scope.hide = function () {
            $scope.setSettings('exampleAnnotations', false);
        };

        $scope.shown = exampleAnnotations.isEnabled;

        $scope.$watch('settings.exampleAnnotations', function (enabled) {
            if (enabled) {
                exampleAnnotations.enable();
            } else {
                exampleAnnotations.disable();
            }
        });
	}
);
