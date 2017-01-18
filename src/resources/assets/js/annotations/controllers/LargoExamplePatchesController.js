/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name LargoExamplePatchesController
 * @memberOf biigle.annotations
 * @description Controller for Largo example patches
 */
angular.module('biigle.annotations').controller('LargoExamplePatchesController', function ($scope, labels, exampleAnnotations) {
		"use strict";

        var patches = [];
        var label;
        var cancelWatcher;

        var handleSelectedLabel = function (l) {
            patches = exampleAnnotations.getForLabel(l);
            label = l;
        };

        var checkWatch = function (enabled) {
            if (cancelWatcher) {
                cancelWatcher();
            }

            if (enabled) {
                cancelWatcher = $scope.$watch(labels.getSelected, handleSelectedLabel);
            } else {
                cancelWatcher = undefined;
            }
        };

        $scope.getPatches = function () {
            return patches;
        };

        $scope.hasPatches = function () {
            return patches.length > 0;
        };

        $scope.getLabelName = function () {
            return label ? label.name : '';
        };

        $scope.hasLabel = function () {
            return label !== undefined;
        };

        $scope.isLoading = function () {
            return patches.$resolved === false;
        };

        $scope.isEnabled = exampleAnnotations.isEnabled;

        $scope.$watch(exampleAnnotations.isEnabled, checkWatch);
	}
);
