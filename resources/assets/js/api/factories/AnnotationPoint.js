/**
 * @ngdoc factory
 * @name AnnotationPoint
 * @memberOf dias.api
 * @description Provides the resource for annotation points.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all points of an annotation and update one of them
var points = AnnotationPoint.query({annotation_id: 1}, function () {
   var point = points[0];
   point.x = 100;
   point.$save();
});

// directly update a point
AnnotationPoint.save({x: 10, y: 10, annotation_id: 1, id: 1});

// add a new point to an annotation
var point = AnnotationPoint.add({x: 50, y: 40, annotation_id: 1}, function () {
   console.log(point); // {x: 50, y: 40, annotation_id: 1, index: 1, id: 1}
});

// delete a point
var points = AnnotationPoint.query({annotation_id: 1}, function () {
   var point = points[0];
   point.$delete();
});
// or directly
AnnotationPoint.delete({id: 1, annotation_id: 1});
 * 
 */
angular.module('dias.api').factory('AnnotationPoint', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/annotations/:annotation_id/points/:id', {
			id: '@id',
			annotation_id: '@annotation_id'
		}, {
			add: {method: 'POST'},
			save: {method: 'PUT'}
	});
});