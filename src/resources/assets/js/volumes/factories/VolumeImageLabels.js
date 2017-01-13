/**
 * @ngdoc factory
 * @name VolumeImageLabels
 * @memberOf biigle.volumes
 * @description Provides the resource to find labels occurring as image labels in a certain volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find labels used as image labels in a volume
var labels = VolumeImageLabels.find({volume_id: 1, query: 'ba'}, function () {
   console.log(labels); // [{id: 12, name: "Bad Quality", ...}, ...]
});
 *
 */
angular.module('biigle.volumes').factory('VolumeImageLabels', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/image-labels/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
