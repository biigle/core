/**
 * @ngdoc factory
 * @name AnnotationImage
 * @memberOf biigle.volumes
 * @description Provides the resource for images having annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations
var ids = AnnotationImage.query({volume_id: 1}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.volumes').factory('AnnotationImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/images/filter/annotations');
});
