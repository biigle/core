/**
 * @ngdoc factory
 * @name ProjectLabelTree
 * @memberOf dias.api
 * @description Provides the resource project label trees
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all label trees used by a project
var trees = ProjectLabel.query({ project_id: 1 }, function () {
   console.log(trees); // [{id: 1, name: "My benthic objects", labels: [...], ...}, ...]
});

// get all label trees available for a project
var trees = ProjectLabel.available({ project_id: 1 }, function () {
   console.log(trees); // [{id: 1, name: "My benthic objects", description: ""}, ...]
});
 *
 */
angular.module('dias.api').factory('ProjectLabelTree', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/label-trees', {project_id: '@project_id'}, {
        available: {
            method: 'GET',
            isArray: true,
            url: URL + '/api/v1/projects/:project_id/label-trees/available'
        }
    });
});
