/**
 * @ngdoc factory
 * @name OwnUser
 * @memberOf dias.core
 * @description Provides the resource for the logged in user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
var user = OwnUser.get({}, function () {
   user.firstname == 'Joel';
   user.$save();
})
 * 
 */
angular.module('dias.core').factory('OwnUser', function ($resource) {
	"use strict";

	return $resource('/api/v1/users/my', {}, {
		save: {method: 'PUT'}
	});
});