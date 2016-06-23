/**
 * @namespace dias.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf dias.ate
 * @description Controller for the transect view
 */
angular.module('dias.ate').controller('AteController', function ($scope, labels, annotations) {
		"use strict";

        var step = 0;
        var STEP = {
            DISMISS: 0,
            RELABEL: 1
        };

        var toggleTitle = function () {
            document.getElementById('dismiss-mode-title').classList.toggle('ng-hide');
            document.getElementById('re-labelling-mode-title').classList.toggle('ng-hide');
        };

        $scope.annotationsExist = annotations.exist;

        $scope.isInDismissMode = function () {
            return step === STEP.DISMISS;
        };

        $scope.goToDismiss = function () {
            step = STEP.DISMISS;
            toggleTitle();
            annotations.goToStep(step);
        };

        $scope.isInReLabellingMode = function () {
            return step === STEP.RELABEL;
        };

        $scope.goToReLabelling = function () {
            step = STEP.RELABEL;
            toggleTitle();
            annotations.goToStep(step);
        };

        $scope.hasSelectedLabel = labels.hasSelectedLabel;

        $scope.getSelectedLabelName = function () {
            return labels.getSelectedLabel().name;
        };

        $scope.isLoading = annotations.isLoading;

        $scope.getClass = function () {
            return {
                'dismiss-mode': $scope.isInDismissMode(),
                're-labelling-mode': $scope.isInReLabellingMode()
            };
        };

        $scope.$watch(labels.getSelectedLabel, annotations.handleSelectedLabel);
	}
);
