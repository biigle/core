/**
 * @ngdoc factory
 * @name VolumeFilterAnnotationLabel
 * @memberOf biigle.ate
 * @description Provides the resource to get annotations with a specific label in a volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get annotations with label 2
var annotations = VolumeFilterAnnotationLabel.query({volume_id: 1, label_id: 2}, function () {
   console.log(annotations); // [12, 24, 32, ...]
});
 *
 */
angular.module('biigle.ate').factory('VolumeFilterAnnotationLabel', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/annotations/filter/label/:label_id');
});
