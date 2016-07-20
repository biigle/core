/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationListItem
 * @memberOf dias.annotations
 * @description An annotation list item.
 */
angular.module('dias.annotations').directive('annotationListItem', function (annotations, mapAnnotations, USER_ID) {
		"use strict";

		return {
			controller: function ($scope) {
				// $scope.attachLabel = function () {
				// 	labels.attachToAnnotation($scope.annotation);
				// };

                $scope.getClass = function () {
                    return {
                        'selected': mapAnnotations.isAnnotationSelected($scope.a.annotation)
                    };
                };

                $scope.getShapeClass = function () {
                    return 'icon-' + $scope.a.shape.toLowerCase();
                };

                $scope.select = function (e) {
                    mapAnnotations.toggleSelect($scope.a.annotation, e.shiftKey);
                };

                $scope.zoomTo = function () {
                    mapAnnotations.fit($scope.a.annotation);
                };

                $scope.canBeRemoved = function () {
                    return $scope.a.label.user && $scope.a.label.user.id === USER_ID;
                };

                $scope.remove = function (e) {
                    e.stopPropagation();
                    var annotation = $scope.a.annotation;
                    if (annotation.labels.length === 1) {
                        if (confirm('Detaching the last label will delete the annotation. Proceed?')) {
                            // detaching the last label will also delete the annotation
                            // but directly deleting the annotation is easier to
                            // implement here
                            mapAnnotations.deleteAnnotation(annotation);
                        }
                    } else {
                        annotations.removeAnnotationLabel(annotation, $scope.a.label);
                    }
                };
			}
		};
	}
);
