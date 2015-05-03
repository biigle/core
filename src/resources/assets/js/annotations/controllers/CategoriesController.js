/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CategoriesController
 * @memberOf dias.annotations
 * @description Controller for the sidebar label categories foldout
 */
angular.module('dias.annotations').controller('CategoriesController', function ($scope, labels) {
		"use strict";

		$scope.selectedID = null;

		$scope.categories = labels.getTree();

		$scope.selectItem = function (item) {
			$scope.selectedID = item.id;
			labels.setSelected(item);
		};
	}
);