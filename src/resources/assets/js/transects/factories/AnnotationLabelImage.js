/**
 * @ngdoc factory
 * @name AnnotationLabelImage
 * @memberOf dias.transects
 * @description Provides the resource for images having annotations with a certain label.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations with label 123
var ids = AnnotationLabelImage.query({transect_id: 1, data: 123}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('dias.transects').factory('AnnotationLabelImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/filter/label/:data');
});
