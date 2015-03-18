/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectIndexController
 * @memberOf dias.projects
 * @description Root controller of the project index page.
 * @example

 */
angular.module('dias.projects').controller('ProjectIndexController', function ($scope, $attrs, Project) {
		"use strict";

		$scope.project = Project.get({id: $attrs.projectId});
	}
);
