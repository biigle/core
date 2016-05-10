/**
 * @ngdoc factory
 * @name TransectUsers
 * @memberOf dias.transects
 * @description Provides the resource for users having annotations in a certain transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all users having annotations in the transect
var users = TransectUsers.query({transect_id: 1}, function () {
   console.log(users); // [{id: 1, firstname: "Jane", ...}, ...]
});
 *
 */
angular.module('dias.transects').factory('TransectUsers', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/users');
});
