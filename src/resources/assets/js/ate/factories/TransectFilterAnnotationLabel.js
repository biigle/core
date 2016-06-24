/**
 * @ngdoc factory
 * @name TransectFilterAnnotationLabel
 * @memberOf dias.ate
 * @description Provides the resource to get annotations with a specific label in a transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get annotations with label 2
var annotations = TransectFilterAnnotationLabel.query({transect_id: 1, label_id: 2}, function () {
   console.log(annotations); // [12, 24, 32, ...]
});
 *
 */
angular.module('dias.ate').factory('TransectFilterAnnotationLabel', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/annotations/filter/label/:label_id');
});
