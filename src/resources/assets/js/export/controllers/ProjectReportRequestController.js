/**
 * @namespace dias.export
 * @ngdoc controller
 * @name ProjectReportRequestController
 * @memberOf dias.export
 * @description Controller for requesting a new transect report
 */
angular.module('dias.export').controller('ProjectReportRequestController', function ($scope, ProjectReport, ReportForm, PROJECT_ID) {
        "use strict";

        var variants = {
            'annotations': [
                'basic',
                'extended',
                'full',
                'csv',
                'area'
            ],
            'image-labels': [
                'basic',
                'csv'
            ]
        };

        var allowedOptions = {
            'annotations': [
                'exportArea',
                'separateLabelTrees'
            ],
            'image-labels': [
                'separateLabelTrees'
            ]
        };

        var defaultForm = {
            type: 'annotations',
            variant: 'basic',
            options: {
                exportArea: false,
                separateLabelTrees: false
            }
        };

        $scope.form = new ReportForm(variants, allowedOptions, defaultForm);

        $scope.submit = function () {
            $scope.form.submit(ProjectReport, {
                project_id: PROJECT_ID
            });
        };
    }
);
