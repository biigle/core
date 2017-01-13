/**
 * @ngdoc factory
 * @name VolumeFilterUsers
 * @memberOf biigle.volumes
 * @description Provides the resource to find users which is compatible with the volume filter mechanism
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find users
var labels = VolumeFilterUsers.find({query: 'ba'}, function () {
   console.log(labels); // [{id: 12, name: "Bad Quality", ...}, ...]
});
 *
 */
angular.module('biigle.volumes').factory('VolumeFilterUser', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/users/find/:query', {}, {
        find: {
            method: 'GET',
            params: {volume_id: null},
            isArray: true
        }
    });
});
