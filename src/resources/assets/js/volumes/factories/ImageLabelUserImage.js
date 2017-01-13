/**
 * @ngdoc factory
 * @name ImageLabelUserImage
 * @memberOf biigle.volumes
 * @description Provides the resource for images having image labels of a certain user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having image labels of user 123
var ids = ImageLabelUserImage.query({volume_id: 1, data: 123}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.volumes').factory('ImageLabelUserImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/images/filter/image-label-user/:data');
});
