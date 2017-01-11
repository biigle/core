/**
 * @ngdoc factory
 * @name TransectUser
 * @memberOf biigle.transects.edit
 * @description Provides the resource for users belonging to a transect.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all users of a transect
var users = TransectUser.query({transect_id: 1}, function () {
   console.log(users); // [{"id": 1, "firstname": "joe", ...}, ...]
});
 *
 */
angular.module('biigle.transects.edit').factory('TransectUser', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/users');
});
