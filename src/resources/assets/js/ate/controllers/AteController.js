/**
 * @namespace dias.ate
 * @ngdoc controller
 * @name AteController
 * @memberOf dias.ate
 * @description Controller for the transect view
 */
angular.module('dias.ate').controller('AteController', function ($scope, TRANSECT_IMAGES, ATE_TRANSECT_ID, labels, images, TransectFilterAnnotationLabel, msg) {
		"use strict";

        // cache that maps label IDs to IDs of annotations with this label
        var labelMapCache = {};

        var step = 0;

        var annotationsExist = false;

        var loading = false;

        var handleError = function (response) {
            loading = false;
            msg.responseError(response);
        };

        var updateDisplayedAnnotations = function (ids) {
            loading = false;
            annotationsExist = ids.length > 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, ids);
            }
            images.updateFiltering();
        };

        var handleSelectedLabel = function (label) {
            if (!label) {
                return;
            }

            var id = label.id;
            TRANSECT_IMAGES.length = 0;
            images.updateFiltering();
            images.scrollToPercent(0);

            if (labelMapCache.hasOwnProperty(id)) {
                updateDisplayedAnnotations(labelMapCache[id]);
            } else {
                loading = true;
                labelMapCache[id] = TransectFilterAnnotationLabel.query(
                    {transect_id: ATE_TRANSECT_ID, label_id: id},
                    updateDisplayedAnnotations,
                    msg.responseError
                );
            }
        };

        $scope.annotationsExist = function () {
            return annotationsExist;
        };

        $scope.isInDismissMode = function () {
            return step === 0;
        };

        $scope.hasSelectedLabel = labels.hasSelectedLabel;

        $scope.getSelectedLabelName = function () {
            return labels.getSelectedLabel().name;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.$watch(labels.getSelectedLabel, handleSelectedLabel);
	}
);
