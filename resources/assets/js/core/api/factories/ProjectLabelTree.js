/**
 * @ngdoc factory
 * @name ProjectLabelTree
 * @memberOf dias.api
 * @description Provides the resource project label trees
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all label trees used by a project
var trees = ProjectLabelTree.query({ project_id: 1 }, function () {
   console.log(trees); // [{id: 1, name: "My benthic objects", labels: [...], ...}, ...]
});

// get all label trees available for a project
var trees = ProjectLabelTree.available({ project_id: 1 }, function () {
   console.log(trees); // [{id: 1, name: "My benthic objects", description: ""}, ...]
});

// add label tree with ID 4 to the trees that are used by project with ID 1
ProjectLabelTree.attach({project_id: 1}, { id: 4 }, function () {
    // attached
});

// remove a label tree from the trees that are used by a project
ProjectLabelTree.detach({ project_id: 1 }, { id: 1 }, function () {
    // detached
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
        },
        attach: {
            method: 'POST',
            url: URL + '/api/v1/projects/:project_id/label-trees'
        },
        detach: {
            method: 'DELETE',
            url: URL + '/api/v1/projects/:project_id/label-trees/:id',
            params: {id: '@id'}
        }
    });
});
