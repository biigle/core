/**
 * @ngdoc factory
 * @name ImageLabelImage
 * @memberOf biigle.transects
 * @description Provides the resource for images having iamge labels with a certain label.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having iamge labels with label 123
var ids = ImageLabelImage.query({transect_id: 1, data: 123}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.transects').factory('ImageLabelImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/filter/image-label/:data');
});
