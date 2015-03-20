/**
 * @ngdoc factory
 * @name ProjectUser
 * @memberOf dias.core
 * @description Provides the resource for users belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all users of the project with ID 1
var users = ProjectUser.query({ project_id: 1 }, function () {
   console.log(users); // [{id: 1, firstname: "Jane", ...}, ...]
});

// update the project role of a user
ProjectUser.save({project_id: 1}, {id: 1, project_role_id: 1});

// attach a user to another project
ProjectUser.attach({project_id: 2}, {id: 1, project_role_id: 2});

// detach a user from the project with ID 1
var users = ProjectUser.query({ project_id: 1 }, function () {
   var user = users[0];
   user.$detach({project_id: 1});
});
// or directly
ProjectUser.detach({project_id: 1}, {id: 1});
 *
 */
angular.module('dias.core').factory('ProjectUser', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/users/:id',
		{ id: '@id' },
		{
			save: { method: 'PUT' },
			attach: { method: 'POST' },
			detach: { method: 'DELETE' }
		}
	);
});