/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name userChooser
 * @memberOf dias.ui.users
 * @description An input field to find a user.
 * @example
// HTML
<input placeholder="Search by username" data-user-chooser="addUser" />

// Controller (example for adding a user to a project)
$scope.addUser = function (user) {
	// new users are guests by default
	var roleId = $scope.roles.guest;

	var success = function () {
		user.project_role_id = roleId;
		$scope.users.push(user);
	};

	// user shouldn't already exist
	if (!getUser(user.id)) {
		ProjectUser.attach(
			{project_id: $scope.projectId},
			{id: user.id, project_role_id: roleId},
			success, msg.responseError
		);
	}
};

 */
angular.module('dias.ui.users').directive('userChooser', function () {
		"use strict";

		return {
			restrict: 'A',

			scope: {
				select: '=userChooser'
			},

			replace: true,

			template: '<input type="text" data-ng-model="selected" data-uib-typeahead="name(user) for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

			controller: function ($scope, User) {
                $scope.name = function (user) {
                    if (user && user.firstname && user.lastname) {
                        return user.firstname + ' ' + user.lastname;
                    }

                    return '';
                };

				$scope.find = function (query) {
					return User.find({query: query}).$promise;
				};
			}
		};
	}
);
