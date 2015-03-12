/**
 * @ngdoc factory
 * @name Role
 * @memberOf dias.core
 * @description Provides the resource for roles.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all roles
var roles = Role.query(function () {
   console.log(roles); // [{id: 1, name: "admin"}, ...]
});

// get one role
var role = Role.get({id: 1}, function () {
   console.log(role); // {id: 1, name: "admin"}
});
 *
 */
angular.module('dias.core').factory('Role', function ($resource) {
	"use strict";

	return $resource('/api/v1/roles/:id', { id: '@id' });
});