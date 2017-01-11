/**
 * @ngdoc factory
 * @name LabelImage
 * @memberOf biigle.transects
 * @description Provides the resource for images having image labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having image labels
var ids = LabelImage.query({transect_id: 1}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.transects').factory('LabelImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/filter/labels');
});
