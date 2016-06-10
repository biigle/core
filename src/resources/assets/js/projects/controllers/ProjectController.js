/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectController
 * @memberOf dias.projects
 * @description Controller for the project information
 */
angular.module('dias.projects').controller('ProjectController', function ($scope,  PROJECT, Project, msg, $timeout, ProjectUser, USER_ID, REDIRECT_URL) {
        "use strict";

        var editing = false;
        var saving = false;

        $scope.projectInfo = {
            name: PROJECT.name,
            description: PROJECT.description
        };

        var handleSavingError = function (response) {
            meg.responseError(response);
            saving = false;
        };

        var infoUpdated = function (project) {
            PROJECT.name = project.name;
            PROJECT.description = project.description;
            editing = false;
            saving = false;
        };

        var projectDeleted = function () {
            msg.success('The project was deleted. Redirecting...');
            $timeout(function () {
                window.location.href = REDIRECT_URL;
             }, 2000);
        };

        var userLeft = function () {
            msg.success('You left the project. Redirecting...');
            $timeout(function () {
                window.location.href = REDIRECT_URL;
             }, 2000);
        };

        var handleProjectDeletionError = function (response) {
            if (response.status === 400) {
                if (confirm('Deleting this project will delete one or more transects with all annotations! Do you want to continue?')) {
                    Project.delete({id: PROJECT.id, force: true}, projectDeleted, msg.responseError);
                }
            } else {
                mgs.responseError(response);
            }
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isSaving = function () {
            return saving;
        };

        $scope.getName = function () {
            return PROJECT.name;
        };

        $scope.getDescription = function () {
            return PROJECT.description;
        };

        $scope.saveChanges = function () {
            saving = true;
            Project.save({
                id: PROJECT.id,
                name: $scope.projectInfo.name,
                description: $scope.projectInfo.description,
            }, infoUpdated, handleSavingError);
        };

        $scope.discardChanges = function () {
            $scope.projectInfo.name = PROJECT.name;
            $scope.projectInfo.description = PROJECT.description;
            editing = false;
        };

        $scope.deleteProject = function () {
            if (confirm('Do you really want to delete the project ' + PROJECT.name + '?')) {
                Project.delete({id: PROJECT.id}, projectDeleted, handleProjectDeletionError);
            }
        };

        $scope.leaveProject = function () {
            if (confirm('Do you really want to leave the project ' + PROJECT.name + '?')) {
                ProjectUser.detach(
                    {project_id: PROJECT.id},
                    {id: USER_ID},
                    userLeft,
                    msg.responseError
                );
            }
        };
    }
);
