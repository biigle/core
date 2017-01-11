/**
 * @ngdoc factory
 * @name AnnotationImage
 * @memberOf biigle.transects
 * @description Provides the resource for images having annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations
var ids = AnnotationImage.query({transect_id: 1}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.transects').factory('AnnotationImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/filter/annotations');
});
