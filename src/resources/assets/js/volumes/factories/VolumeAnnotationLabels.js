/**
 * @ngdoc factory
 * @name VolumeAnnotationLabels
 * @memberOf biigle.volumes
 * @description Provides the resource to find labels occurring as annotation labels in a certain volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find label categories used in a volume
var labels = VolumeAnnotationLabels.find({volume_id: 1, query: 'an'}, function () {
   console.log(labels); // [{id: 12, name: "Anemone", ...}, ...]
});
 *
 */
angular.module('biigle.volumes').factory('VolumeAnnotationLabels', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/annotation-labels/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
