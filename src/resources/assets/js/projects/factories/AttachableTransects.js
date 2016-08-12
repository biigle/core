/**
 * @ngdoc factory
 * @name AttachableTransects
 * @memberOf dias.projects
 * @description Provides the resource for transects that may be attached to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
 // get attachable transects for project 1
 var transects = AttachableTransects.query({id: 1}, function () {
    console.log(transects); //[{id: 12, name: 'my transect'}, ...]
 });
 *
 */
angular.module('dias.projects').factory('AttachableTransects', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:id/attachable-transects');
});
