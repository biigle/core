/**
 * @ngdoc factory
 * @name MediaType
 * @memberOf biigle.api
 * @description Provides the resource for media types.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all media types
var mediaTypes = MediaType.query(function () {
   console.log(mediaTypes); // [{id: 1, name: "time-series"}, ...]
});

// get one media type
var mediaType = MediaType.get({id: 1}, function () {
   console.log(mediaType); // {id: 1, name: "time-series"}
});
 *
 */
angular.module('biigle.api').factory('MediaType', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/media-types/:id', { id: '@id' });
});
