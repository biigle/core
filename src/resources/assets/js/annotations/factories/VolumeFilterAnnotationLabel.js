/**
 * @ngdoc factory
 * @name VolumeFilterAnnotationLabel
 * @memberOf biigle.annotations
 * @description Provides the resource to get annotations with a specific label in a volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the newest 2 annotations with label 4
var annotations = VolumeFilterAnnotationLabel.query({volume_id: 1, label_id: 4, take: 2}, function () {
   console.log(annotations); // [12, 24]
});
 *
 */
angular.module('biigle.annotations').factory('VolumeFilterAnnotationLabel', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/annotations/filter/label/:label_id');
});
