/**
 * @ngdoc factory
 * @name VolumeImageOrderByFilename
 * @memberOf biigle.volumes
 * @description Provides the resource for images of volumes, ordered by filename
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the volume with ID 1 ordered by filename
var images = VolumeImageOrderByFilename.query({volume_id: 1}, function () {
   console.log(images); // [1, 14, 12, ...]
});
 *
 */
angular.module('biigle.volumes').factory('VolumeImageOrderByFilename', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/volumes/:volume_id/images/order-by/filename');
});
