/**
 * @ngdoc factory
 * @name AnnotationUserImage
 * @memberOf dias.transects
 * @description Provides the resource for images having annotations of a certain user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations of user 123
var ids = AnnotationUserImage.query({transect_id: 1, data: 123}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('dias.transects').factory('AnnotationUserImage', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/filter/annotation-user/:data');
});
