/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectMembersController
 * @memberOf dias.projects
 * @description Handles modification of the members of a project.
 */
angular.module('dias.projects').controller('ProjectMembersController', function ($scope, Role, ProjectUser) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
		};

		var genericError = function (response) {
			var message = response.data.message || "There was an error, sorry.";
			window.$diasPostMessage(message, 'danger');
		};

		Role.query(function (rolesArray) {
			$scope.roles = {};
			for (var i = rolesArray.length - 1; i >= 0; i--) {
				$scope.roles[rolesArray[i].name] = rolesArray[i].id;
			}
		});

		$scope.project.$promise.then(function () {
			$scope.users = ProjectUser.query({ project_id: $scope.project.id });
		});

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.changeUserRole = function (userId, role) {
			var user = getUser(userId);
			var roleId = $scope.roles[role];

			// no action required
			if (user.project_role_id == roleId) {
				return;
			}

			var success = function () {
				user.project_role_id = roleId;
			};

			ProjectUser.save(
				{project_id: $scope.project.id},
				{id: user.id, project_role_id: roleId},
				success, genericError
			);
		};

		$scope.removeUser = function (userId) {
			var index;
			var user;

			var success = function () {
				$scope.users.splice(index, 1);
			};

			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == userId) {
					user = $scope.users[i];
					index = i;
				}
			}

			user.$detach({project_id: $scope.project.id}, success, genericError);
		};
	}
);
