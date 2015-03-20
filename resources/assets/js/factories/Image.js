/**
 * @ngdoc factory
 * @name Image
 * @memberOf dias.core
 * @description Provides the resource for images. This resource is only for 
 * finding out which transect an image belongs to. The image files are
 * directly called from the API.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get an image
var image = Image.get({id: 1}, function () {
   console.log(image); // {id: 1, transect_id: 1}
});
 *
 */
angular.module('dias.core').factory('Image', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/images/:id');
});