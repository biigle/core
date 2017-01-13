/**
 * @ngdoc factory
 * @name VolumeImage
 * @memberOf biigle.api
 * @description Provides the resource for images of volumes.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the volume with ID 1
var images = VolumeImage.query({volume_id: 1}, function () {
   console.log(images); // [1, 12, 14, ...]
});

// Add new images to a volume
var images = VolumeImage.save({volume_id: 1}, {'images': '1.jpg, 2.jpg'}, function () {
  console.log(images); // [{id: 1, filename: '1.jpg', id: 2, filename: '2.jpg'}]
});
 *
 */
angular.module('biigle.api').factory('VolumeImage', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/volumes/:volume_id/images', {}, {
        save: { method: 'POST', isArray: true }
    });
});
