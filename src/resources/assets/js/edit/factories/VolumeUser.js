/**
 * @ngdoc factory
 * @name VolumeUser
 * @memberOf biigle.volumes.edit
 * @description Provides the resource for users belonging to a volume.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all users of a volume
var users = VolumeUser.query({volume_id: 1}, function () {
   console.log(users); // [{"id": 1, "firstname": "joe", ...}, ...]
});
 *
 */
angular.module('biigle.volumes.edit').factory('VolumeUser', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/users');
});
