/**
 * @ngdoc factory
 * @name Largo
 * @memberOf biigle.project-largo
 * @description Override the biigle.largo Largo service to work with the projects endpoint
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// save an Largo session for project 3
Largo.save({project_id: 3}, {dismissed: {1: [...]}, changed: {12: 1, ...}} function () {
   // saved
});
 *
 */
angular.module('biigle.project-largo').factory('Largo', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/largo');
});
