/**
 * @ngdoc factory
 * @name OwnUser
 * @memberOf dias.core
 * @description Provides the resource for the logged in user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the username
var user = OwnUser.get(function () {
   console.log(user.firstname);
});

// changing the username
var user = OwnUser.get(function () {
   user.firstname == 'Joel';
   user.$save();
});
// or directly
OwnUser.save({firstname: 'Joel'});

// deleting the user
var user = OwnUser.get(function () {
   user.$delete();
});
// or directly
OwnUser.delete();
 * 
 */
angular.module('dias.core').factory('OwnUser', function ($resource) {
	"use strict";

	return $resource('/api/v1/users/my', {}, {
		save: {method: 'PUT'}
	});
});