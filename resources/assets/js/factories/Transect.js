/**
 * @ngdoc factory
 * @name Transect
 * @memberOf dias.core
 * @description Provides the resource for transects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get one transect
var transect = Transect.get({id: 1}, function () {
   console.log(transect); // {id: 1, name: "transect 1"}
});

// update a transect
var transect = Transect.get({id: 1}, function () {
   transect.name = "my transect";
   transect.$save();
});
// or directly
Transect.save({id: 1, name: "my transect"});
 *
 */
angular.module('dias.core').factory('Transect', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/transects/:id',
		{ id: '@id' },
		{
			save: { method: 'PUT' }
		}
		);
});