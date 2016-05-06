/**
 * @ngdoc factory
 * @name TransectImage
 * @memberOf dias.api
 * @description Provides the resource for images of transects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the transect with ID 1
var images = TransectImage.query({transect_id: 1}, function () {
   console.log(images); // [1, 12, 14, ...]
});

// Add new images to a transect
var images = TransectImage.save({transect_id: 1}, {'images': '1.jpg, 2.jpg'}, function () {
  console.log(images); // [{id: 1, filename: '1.jpg', id: 2, filename: '2.jpg'}]
});
 *
 */
angular.module('dias.api').factory('TransectImage', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/transects/:transect_id/images', {}, {
        save: { method: 'POST', isArray: true }
    });
});
