/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectsController
 * @memberOf dias.projects
 * @description Handles modification of the transects of a project.
 */
try {
angular.module('dias.projects').controller('ProjectTransectsController', function ($scope, ProjectTransect) {
		"use strict";

		$scope.transects = ProjectTransect.query({ project_id: $scope.projectId });

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.removeTransect = function (index) {
			$scope.transects.splice(index, 1);
		};

		// leave editing mode when there are no more transects to edit
		$scope.$watchCollection('transects', function (transects) {
			if (transects && transects.length === 0) {
				$scope.editing = false;
			}
		});
	}
);
} catch (e) {
	// dias.projects is not loaded on this page
}