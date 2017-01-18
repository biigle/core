/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name LargoExamplePatchesSettingsController
 * @memberOf biigle.annotations
 * @description Controller for Largo example patches settings
 */
angular.module('biigle.annotations').controller('LargoExamplePatchesSettingsController', function ($scope, exampleAnnotations, settings) {
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
