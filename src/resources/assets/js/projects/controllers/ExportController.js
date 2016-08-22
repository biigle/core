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

        var types = {
            'basic annotation': Report.getBasic,
            'extended annotation': Report.getExtended,
            'full annotation': Report.getFull,
            'image label': Report.getImageLabel
        };

        // all reports that can have the "restrict to export area" option
        var restrictable = [
            'basic annotation',
            'extended annotation',
            'full annotation'
        ];

        var handleSuccess = function () {
            requested = true;
        };

        var handleError = function (response) {
            requested = false;
            msg.responseError(response);
        };

        $scope.selected = {
            type: 'basic annotation',
            restrict: false
        };

        $scope.canBeRestricted = function () {
            return restrictable.indexOf($scope.selected.type) !== -1;
        };

        $scope.requestReport = function () {
            if (!$scope.selected.type) return;

            var data = {};

            if ($scope.canBeRestricted()) {
                data.restrict = $scope.selected.restrict ? '1' : '0';
            }

            types[$scope.selected.type]({project_id: PROJECT.id}, data, handleSuccess, handleError);
        };

        $scope.isRequested = function () {
            return requested;
        };
    }
);
