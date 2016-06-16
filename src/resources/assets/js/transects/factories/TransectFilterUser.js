/**
 * @ngdoc factory
 * @name TransectFilterUsers
 * @memberOf dias.transects
 * @description Provides the resource to find users which is compatible with the transect filter mechanism
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find users
var labels = TransectFilterUsers.find({query: 'ba'}, function () {
   console.log(labels); // [{id: 12, name: "Bad Quality", ...}, ...]
});
 *
 */
angular.module('dias.transects').factory('TransectFilterUser', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/users/find/:query', {}, {
        find: {
            method: 'GET',
            params: {transect_id: null},
            isArray: true
        }
    });
});
