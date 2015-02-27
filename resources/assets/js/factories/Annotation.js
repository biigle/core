/**
 * @ngdoc factory
 * @name Annotation
 * @memberOf dias.core
 * @description Provides the resource for annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the shape ID of an annotation
var annotation = Annotation.get({id: 123}, function () {
   console.log(annotation.shape_id);
});

// deleting an annotation
var annotation = Annotation.get({id: 123}, function () {
   annotation.$delete();
});
// or directly
Annotation.delete({id: 123});
 * 
 */
angular.module('dias.core').factory('Annotation', function ($resource) {
	"use strict";

	return $resource('/api/v1/annotations/:id/', { id: '@id'	});
});