/**
 * @ngdoc factory
 * @name Ate
 * @memberOf biigle.project-ate
 * @description Override the biigle.ate Ate service to work with the projects endpoint
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// save an ATE session for project 3
Ate.save({project_id: 3}, {dismissed: {1: [...]}, changed: {12: 1, ...}} function () {
   // saved
});
 *
 */
angular.module('biigle.project-ate').factory('Ate', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/ate');
});
