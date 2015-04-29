/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CategoriesController
 * @memberOf dias.annotations
 * @description Controller for the sidebar label categories foldout
 */
angular.module('dias.annotations').controller('CategoriesController', function ($scope, labels) {
		"use strict";

		$scope.categories = labels.getTree();
	}
);