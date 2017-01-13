/**
 * @namespace biigle.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf biigle.ate
 * @description Controller for the volume view
 */
angular.module('biigle.ate').controller('AteController', function ($scope, labels, annotations, msg) {
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

        $scope.saveReLabelling = function () {
            annotations.save().then(function () {
                $scope.goToDismiss();
                msg.success('Saved. You can now start a new re-evaluation session.');
            });
        };

        $scope.hasSelectedLabel = labels.hasSelectedLabel;

        $scope.getSelectedLabelName = function () {
            return labels.getSelectedLabel().name;
        };

        $scope.isLoading = annotations.isLoading;
        $scope.isSaving = annotations.isSaving;
        $scope.canContinue = annotations.canContinue;

        $scope.getClass = function () {
            return {
                'dismiss-mode': $scope.isInDismissMode(),
                're-labelling-mode': $scope.isInReLabellingMode()
            };
        };

        $scope.$watch(labels.getSelectedLabel, annotations.handleSelectedLabel);
	}
);
