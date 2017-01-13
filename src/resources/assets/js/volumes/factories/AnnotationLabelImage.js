/**
 * @ngdoc factory
 * @name AnnotationLabelImage
 * @memberOf biigle.volumes
 * @description Provides the resource for images having annotations with a certain label.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations with label 123
var ids = AnnotationLabelImage.query({volume_id: 1, data: 123}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('biigle.volumes').factory('AnnotationLabelImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/images/filter/annotation-label/:data');
});
