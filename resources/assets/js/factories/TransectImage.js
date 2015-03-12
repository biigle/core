/**
 * @ngdoc factory
 * @name TransectImage
 * @memberOf dias.core
 * @description Provides the resource for images of transects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the transect with ID 1
var images = TransectImage.query({transect_id: 1}, function () {
   console.log(images); // [1, 12, 14, ...]
});
 *
 */
angular.module('dias.core').factory('TransectImage', function ($resource) {
	"use strict";

	return $resource('/api/v1/transects/:transect_id/images');
});