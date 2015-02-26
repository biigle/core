/**
 * @ngdoc factory
 * @name Annotation
 * @memberOf dias.core
 * @description Provides the resource for an annotation.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the points of an annotation
var annotation = Annotation.get({id: 123}, function () {
   console.log(annotation.points);
});

// deleting an annotation
var annotation = Annotation.get({id: 123}, function () {
   annotation.$delete();
});
// or directly
Annotation.delete({id: 123});

// adding an annotation point
// this will **not** work as the instance function `annotation.$addPoint()`!
var annotation = Annotation.addPoint(
   // annotation id
   {id: 1},
   // new point coordinates
   {x: 50, y: 40},
   function () {
      // updated annotation with new points
      console.log(annotation.points);
});

// deleting an annotation point (the attributeId is the point id)
var annotation = Annotation.get({id: 123}, function () {
   // this will **not** remove the point form the local annotation object!
   annotation.$deletePoint({attributeId: 321});
});
// or directly
var annotation = Annotation.deletePoint({id: 123, attributeId: 321}, function () {
   // updated annotation object without the removed point
   console.log(annotation);
});
 * 
 */
angular.module('dias.core').factory('Annotation', function ($resource) {
	"use strict";

	return $resource('/api/v1/annotations/:id/:attribute/:attributeId', {
		id: '@id',
		attribute: '',
		attributeId: ''
	},
	{
		addPoint: {method: 'POST', params: {attribute: 'points'}},
		deletePoint: {method: 'DELETE', params: {attribute: 'points'}}
	});
});