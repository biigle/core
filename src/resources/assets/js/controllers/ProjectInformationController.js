/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectInformationController
 * @memberOf dias.projects
 * @description Handles modification of the information of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectInformationController', function ($scope) {
		"use strict";
		
		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};
	}
);
