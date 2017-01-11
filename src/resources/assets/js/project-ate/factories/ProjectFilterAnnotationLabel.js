/**
 * @ngdoc factory
 * @name ProjectFilterAnnotationLabel
 * @memberOf biigle.project-ate
 * @description Provides the resource to get annotations with a specific label in a project
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get annotations with label 2
var annotations = ProjectFilterAnnotationLabel.query({project_id: 1, label_id: 2}, function () {
   console.log(annotations); // [12, 24, 32, ...]
});
 *
 */
angular.module('biigle.project-ate').factory('ProjectFilterAnnotationLabel', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/projects/:project_id/annotations/filter/label/:label_id');
});
