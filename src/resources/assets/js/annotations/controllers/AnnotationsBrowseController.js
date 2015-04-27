/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsBrowseController
 * @memberOf dias.annotations
 * @description Controller for the "browse annotations" foldout
 */
angular.module('dias.annotations').controller('AnnotationsBrowseController', function ($scope, annotations, shapes, mapAnnotations) {
		"use strict";

		var refreshAnnotations = function () {
			$scope.annotations = annotations.current();
		};

		var selectedFeatures = mapAnnotations.getSelectedFeatures();

		$scope.annotations = [];

		$scope.clearSelection = mapAnnotations.clearSelection;
		$scope.selectAnnotation = function (e, id) {
			// allow multiple selections
			if (!e.shiftKey) {
				$scope.clearSelection();
			}
			mapAnnotations.select(id);
		};

		$scope.isSelected = function (id) {
			var selected = false;
			selectedFeatures.forEach(function (feature) {
				if (feature.annotation && feature.annotation.id == id) {
					selected = true;
				}
			});
			return selected;
		};

		$scope.$watch('foldout', function (foldout) {
			if (foldout === 'annotations-browse') {
				refreshAnnotations();
			}
		});

		$scope.$on('image.shown', refreshAnnotations);
	}
);