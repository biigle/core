/**
 * @namespace dias.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf dias.ate
 * @description Controller for the transect view
 */
angular.module('dias.ate').controller('AteController', function ($scope, TRANSECT_IMAGES, LABEL_MAP, labels, images) {
		"use strict";

        var step = 0;

        var annotationsExist = false;

        var handleSelectedLabel = function (label) {
            if (!label) {
                return;
            }

            var id = label.id;
            annotationsExist = LABEL_MAP.hasOwnProperty(id);
            // replace the currently displayed patches with the patches of the new
            // label
            TRANSECT_IMAGES.length = 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, LABEL_MAP[id]);
            }
            images.updateFiltering();
            images.scrollToPercent(0);
        };


        // required for compatibility to the re-used parts of dias/transects
        $scope.isInLabelMode = function () {
            return true;
        };

        $scope.annotationsExist = function () {
            return annotationsExist;
        };

        $scope.isInDismissMode = function () {
            return step === 0;
        };

        $scope.hasSelectedLabel = labels.hasSelectedLabel;

        $scope.$watch(labels.getSelectedLabel, handleSelectedLabel);
	}
);
