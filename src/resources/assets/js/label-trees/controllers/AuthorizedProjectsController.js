/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name AuthorizedProjectsController
 * @memberOf biigle.label-trees
 * @description Controller for the the autorized projects of a label tree
 */
angular.module('biigle.label-trees').controller('AuthorizedProjectsController', function ($scope, LABEL_TREE, AUTH_PROJECTS, AUTH_OWN_PROJECTS, Project, LabelTreeAuthorizedProject) {
        "use strict";

        var editing = false;
        var loading = false;

        var ownProjects = null;

        // all projects the current user belongs to and that are not already authorized
        var projectsForAuthorization = null;

        var projectIsNotAuthorized = function (project) {
            for (var i = AUTH_PROJECTS.length - 1; i >= 0; i--) {
                if (AUTH_PROJECTS[i].id === project.id) {
                    return false;
                }
            }

            return true;
        };

        var updateProjectsForAuthorization = function (projects) {
            projectsForAuthorization = projects.filter(projectIsNotAuthorized);
        };

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var projectAdded = function (project) {
            AUTH_PROJECTS.push(project);
            // user can only authorize own projects
            AUTH_OWN_PROJECTS.push(project.id);
            updateProjectsForAuthorization(ownProjects);
            loading = false;
        };

        var projectRemoved = function (project) {
            var i;
            for (i = AUTH_PROJECTS.length - 1; i >= 0; i--) {
                if (AUTH_PROJECTS[i].id === project.id) {
                    AUTH_PROJECTS.splice(i, 1);
                    break;
                }
            }

            i = AUTH_OWN_PROJECTS.indexOf(project.id);
            if (i !== -1) {
                AUTH_OWN_PROJECTS.splice(i, 1);
            }

            updateProjectsForAuthorization(ownProjects);
            loading = false;
        };

        $scope.hasProjects = function () {
            return AUTH_PROJECTS.length > 0;
        };

        $scope.getProjects = function () {
            return AUTH_PROJECTS;
        };

        $scope.isOwnProject = function (project) {
            return AUTH_OWN_PROJECTS.indexOf(project.id) !== -1;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.getVisibilityId = function () {
            return LABEL_TREE.visibility_id;
        };

        $scope.toggleEditing = function () {
            if (!ownProjects) {
                ownProjects = Project.query(updateProjectsForAuthorization);
            }

            editing = !editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.getProjectsForAuthorization = function () {
            return projectsForAuthorization;
        };

        $scope.addAuthorizedProject = function (project) {
            loading = true;
            LabelTreeAuthorizedProject.addAuthorized(
                {id: LABEL_TREE.id},
                {id: project.id},
                function () {
                    projectAdded(project);
                },
                handleError
            );
        };

        $scope.removeAuthorizedProject = function (project) {
            loading = true;
            LabelTreeAuthorizedProject.removeAuthorized(
                {id: LABEL_TREE.id},
                {id: project.id},
                function () {
                    projectRemoved(project);
                },
                handleError
            );
        };
    }
);
