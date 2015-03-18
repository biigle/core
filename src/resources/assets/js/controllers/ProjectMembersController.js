/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectMembersController
 * @memberOf dias.projects
 * @description Handles modification of the members of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectMembersController', function ($scope, Role, ProjectUser) {
		"use strict";
		var initRoles = function (rolesArray) {
			$scope.roles = {};
			for (var i = rolesArray.length - 1; i >= 0; i--) {
				$scope.roles[rolesArray[i].name] = rolesArray[i].id;
			}
		};

		Role.query(initRoles);

		$scope.project.$promise.then(function () {
			$scope.users = ProjectUser.query({ project_id: $scope.project.id });
		});
	}
);
