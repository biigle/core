/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ExportController
 * @memberOf dias.projects
 * @description Controller for the export feature of the projects page
 */
angular.module('dias.projects').controller('ExportController', function ($scope, Report, msg, PROJECT) {
        "use strict";

        var requested = false;

        var names = [
            'basic annotation',
            'extended annotation',
            'full annotation',
            'annotation CSV',
            'basic image label',
            'image label CSV'
        ];

        var resources = [
            Report.getBasic,
            Report.getExtended,
            Report.getFull,
            Report.getCsv,
            Report.getImageLabel,
            Report.getImageLabelCsv
        ];

        // all reports that can have the "restrict to export area" option
        var restrictable = [0, 1, 2, 3];

        var handleSuccess = function () {
            requested = true;
        };

        var handleError = function (response) {
            requested = false;
            msg.responseError(response);
        };

        $scope.selected = {
            index: 0,
            option: '0',
            restrict: false
        };

        $scope.canBeRestricted = function () {
            return restrictable.indexOf($scope.selected.index) !== -1;
        };

        $scope.requestReport = function () {
            if ($scope.selected.index === undefined) return;

            var data = {};

            if ($scope.canBeRestricted()) {
                data.restrict = $scope.selected.restrict ? '1' : '0';
            }

            resources[$scope.selected.index]({project_id: PROJECT.id}, data, handleSuccess, handleError);
        };

        $scope.isRequested = function () {
            return requested;
        };

        $scope.getSelectedName = function () {
            return names[$scope.selected.index];
        };

        $scope.$watch('selected.option', function (option) {
            $scope.selected.index = parseInt(option);
        });
    }
);
