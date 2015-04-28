/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationListItem
 * @memberOf dias.annotations
 * @description An annotation list item.
 */
angular.module('dias.annotations').directive('annotationListItem', function () {
		"use strict";

		return {
			controller: function ($scope) {
				$scope.shapeClass = 'icon-' + $scope.annotation.shape.toLowerCase();
			}
		};
	}
);
