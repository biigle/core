/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name TransectsController
 * @memberOf dias.projects
 * @description Controller for the the transects of a project
 */
angular.module('dias.projects').controller('TransectsController', function ($scope, PROJECT, TRANSECTS, ProjectTransect, msg) {
        "use strict";

        var editing = false;
        var loading = false;

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var detachError = function (transect, response) {
            if (response.status === 400) {
                if (confirm('The transect you are about to remove belongs only to this project and will be deleted. Are you sure you want to delete this transect?')) {
                    ProjectTransect.detach(
                        {project_id: PROJECT.id, force: true},
                        {id: transect.id},
                        function () {
                            detachSuccess(transect);
                        },
                        handleError
                    );
                }
            } else {
                handleError(response);
            }
        };

        var detachSuccess = function (transect) {
            for (var i = TRANSECTS.length - 1; i >= 0; i--) {
                if (TRANSECTS[i].id === transect.id) {
                    TRANSECTS.splice(i, 1);
                    break;
                }
            }
            loading = false;
            if (!$scope.hasTransects()) {
                editing = false;
            }
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.getTransects = function () {
            return TRANSECTS;
        };

        $scope.hasTransects = function () {
            return TRANSECTS.length > 0;
        };

        $scope.detachTransect = function (transect) {
            loading = true;
            ProjectTransect.detach(
                {project_id: PROJECT.id},
                {id: transect.id},
                function () {
                    detachSuccess(transect);
                },
                function (response) {
                    detachError(transect, response);
                }
            );
        };
    }
);
