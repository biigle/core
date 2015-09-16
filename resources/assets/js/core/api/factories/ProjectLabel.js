/**
 * @ngdoc factory
 * @name ProjectLabel
 * @memberOf dias.api
 * @description Provides the resource for labels belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels of the project with ID 1
var labels = ProjectLabel.query({ project_id: 1 }, function () {
   console.log(labels); // [{id: 1, name: "Coral", ...}, ...]
});
 *
 */
angular.module('dias.api').factory('ProjectLabel', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/labels', {project_id: '@project_id'});
});
