/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsEditController
 * @memberOf dias.annotations
 * @description Controller for the "edit annotations" foldout
 */
angular.module('dias.annotations').controller('AnnotationsEditController', function ($scope, mapAnnotations) {
		"use strict";

		var startDrawing = function () {
			mapAnnotations.startDrawing($scope.selectedShape);
		};

		$scope.selectedShape = 'Point';

		$scope.selectShape = function (name) {
			$scope.selectedShape = name;
		};

		$scope.$watch('selectedShape', function (shape) {
			mapAnnotations.finishDrawing();
			startDrawing();
		});

		$scope.$watch('foldout', function (foldout) {
			if (foldout === 'annotations-edit') {
				startDrawing();
			} else {
				mapAnnotations.finishDrawing();
			}
		});
	}
);