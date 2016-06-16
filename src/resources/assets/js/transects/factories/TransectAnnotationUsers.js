/**
 * @ngdoc factory
 * @name TransectAnnotationUsers
 * @memberOf dias.transects
 * @description Provides the resource to find users occurring in a certain transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find users who have annotations in a transect
var users = TransectAnnotationUsers.find({transect_id: 1, query: 'jo'}, function () {
   console.log(users); // [{id: 1, firstname: "Joe", ...}, ...]
});
 *
 */
angular.module('dias.transects').factory('TransectAnnotationUsers', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/annotation-users/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
