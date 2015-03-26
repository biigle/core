/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectIndexController
 * @memberOf dias.projects
 * @description Root controller of the project index page.
 */
angular.module('dias.projects').controller('ProjectIndexController', function ($scope, $attrs, Project, $modal, ProjectUser, msg, $timeout) {
		"use strict";

		var leavingSuccess = function () {
			$scope.redirectToDashboard($attrs.leavingSuccessMsg);
		};

		$scope.redirectToDashboard = function (message, type) {
			type = type || 'success';
			msg.post(type, message);
			$timeout(function () {
				window.location.href = $attrs.dashboardUrl;
			}, 2000);
		};

		$scope.project = Project.get({id: $attrs.projectId});

		$scope.projectId = $attrs.projectId;

		$scope.ownUserId = $attrs.userId;

		$scope.leaveProject = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmLeaveProjectModal.html',
				size: 'sm'
			});

			modalInstance.result.then(function (result) {
				if (result == 'yes') {
					ProjectUser.detach({project_id: $scope.project.id}, {id: $scope.ownUserId}, leavingSuccess, msg.responseError);
				}
			});
		};
	}
);
