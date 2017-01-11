/**
 * @ngdoc factory
 * @name TransectImageOrderByFilename
 * @memberOf biigle.transects
 * @description Provides the resource for images of transects, ordered by filename
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the transect with ID 1 ordered by filename
var images = TransectImageOrderByFilename.query({transect_id: 1}, function () {
   console.log(images); // [1, 14, 12, ...]
});
 *
 */
angular.module('biigle.transects').factory('TransectImageOrderByFilename', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/transects/:transect_id/images/order-by/filename');
});
