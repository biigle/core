/**
 * @namespace dias.export
 * @ngdoc controller
 * @name TransectReportRequestController
 * @memberOf dias.export
 * @description Controller for requesting a new transect report
 */
angular.module('dias.export').controller('TransectReportRequestController', function ($scope, TransectReport, ReportForm, TRANSECT_ID) {
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
            $scope.form.submit(TransectReport, {
                transect_id: TRANSECT_ID
            });
        };
    }
);
