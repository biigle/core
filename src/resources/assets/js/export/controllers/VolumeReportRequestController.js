/**
 * @namespace biigle.export
 * @ngdoc controller
 * @name VolumeReportRequestController
 * @memberOf biigle.export
 * @description Controller for requesting a new volume report
 */
angular.module('biigle.export').controller('VolumeReportRequestController', function ($scope, VolumeReport, ReportForm, VOLUME_ID) {
        "use strict";

        var variants = {
            'annotations': [
                'basic',
                'extended',
                'area',
                'full',
                'csv'
            ],
            'image-labels': [
                'basic',
                'csv'
            ]
        };

        var allowedOptions = {
            'annotations': [
                'exportArea',
                'separateLabelTrees',
                'annotationSession'
            ],
            'image-labels': [
                'separateLabelTrees',
                'annotationSession'
            ]
        };

        var defaultForm = {
            type: 'annotations',
            variant: 'basic',
            options: {
                exportArea: false,
                separateLabelTrees: false,
                annotationSession: null
            }
        };

        $scope.form = new ReportForm(variants, allowedOptions, defaultForm);

        $scope.submit = function () {
            $scope.form.submit(VolumeReport, {
                volume_id: VOLUME_ID
            });
        };
    }
);
