/**
 * @ngdoc factory
 * @name ImageAnnotation
 * @memberOf dias.api
 * @description Provides the resource for annotations of an image.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all annotations of an image
var annotations = ImageAnnotation.query({image_id: 1}, function () {
   console.log(annotations); // [{id: 1, shape_id: 1, ...}, ...]
});

// add a new annotation to an image
var annotation = ImageAnnotation.add({
   image_id: 1,
   shape_id: 1,
   points: [
      { x: 10, y: 20 }
   ]
});
 *
 */
angular.module('dias.api').factory('ImageAnnotation', function ($resource, URL) {
	"use strict";

	return $resource(
		URL + '/api/v1/images/:image_id/annotations',
		{ image_id: '@image_id' },
		{ add: { method: 'POST' } }
	);
});