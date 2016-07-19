/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationListItem
 * @memberOf dias.annotations
 * @description An annotation list item.
 */
angular.module('dias.annotations').directive('annotationListItem', function (labels, mapAnnotations) {
		"use strict";

		return {
			scope: true,
			controller: function ($scope) {
				$scope.shapeClass = 'icon-' + $scope.annotation.shape.toLowerCase();

				$scope.selected = function () {
					return $scope.isSelected($scope.annotation.id);
				};

				$scope.attachLabel = function () {
					labels.attachToAnnotation($scope.annotation);
				};

				$scope.removeLabel = function (label) {
                    if ($scope.annotation.labels.length === 1) {
                        if (confirm('Detaching the last label will delete the annotation. Proceed?')) {
                            // detaching the last label will also delete the annotation
                            // but directly deleting the annotation is easier to
                            // implement here
                            mapAnnotations.deleteAnnotation($scope.annotation);
                        }
                    } else {
                        labels.removeFromAnnotation($scope.annotation, label);
                    }
				};

				$scope.canAttachLabel = function () {
					return $scope.selected() && labels.hasSelected();
				};

				$scope.currentLabel = labels.getSelected;

				$scope.currentConfidence = labels.getCurrentConfidence;
			}
		};
	}
);
