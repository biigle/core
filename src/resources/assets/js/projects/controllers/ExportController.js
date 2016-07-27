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
            basic: Report.getBasic,
            extended: Report.getExtended,
            full: Report.getFull,
        };

        var handleSuccess = function () {
            requested = true;
        };

        var handleError = function (response) {
            requested = false;
            msg.responseError(response);
        };

        $scope.selected = {
            type: 'basic',
            restrict: false
        };

        $scope.requestReport = function () {
            if (!$scope.selected.type) return;

            types[$scope.selected.type](
                {project_id: PROJECT.id, restrict: $scope.selected.restrict ? '1' : '0'},
                handleSuccess,
                handleError
            );
        };

        $scope.isRequested = function () {
            return requested;
        };
    }
);
