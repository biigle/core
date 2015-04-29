/**
 * @ngdoc factory
 * @name Annotation
 * @memberOf dias.api
 * @description Provides the resource for annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the shape ID of an annotation
var annotation = Annotation.get({id: 123}, function () {
   console.log(annotation.shape_id);
});

// saving an annotation (updating the annotation points)
var annotation = Annotation.get({id: 1}, function () {
   annotation.points = [{x: 10, y: 10}];
   annotation.$save();
});
// or directly
Annotation.save({
   id: 1, points: [{x: 10, y: 10}]
});

// deleting an annotation
var annotation = Annotation.get({id: 123}, function () {
   annotation.$delete();
});
// or directly
Annotation.delete({id: 123});

// get all annotations of an image
// note, that the `id` is now the image ID and not the annotation ID for the
// query!
var annotations = Annotation.query({id: 1}, function () {
   console.log(annotations); // [{id: 1, shape_id: 1, ...}, ...]
});

// add a new annotation to an image
// note, that the `id` is now the image ID and not the annotation ID for the
// query!
var annotation = Annotation.add({
   id: 1,
   shape_id: 1,
   points: [
      { x: 10, y: 20 }
   ]
});
 * 
 */
angular.module('dias.api').factory('Annotation', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/:endpoint/:id/:slug',
		{ id: '@id'	},
		{
			get: {
				method: 'GET',
				params: { endpoint: 'annotations' }
			},
			save: {
				method: 'PUT',
				params: { endpoint: 'annotations' }
			},
			delete: {
				method: 'DELETE',
				params: { endpoint: 'annotations' }
			},
			query: {
				method: 'GET',
				params: { endpoint: 'images', slug: 'annotations' },
				isArray: true
			},
			add: {
				method: 'POST',
				params: { endpoint: 'images', slug: 'annotations' }
			}
		});
});