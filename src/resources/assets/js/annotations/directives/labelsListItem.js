/**
 * @namespace biigle.annotations
 * @ngdoc directive
 * @name labelsListItem
 * @memberOf biigle.annotations
 * @description An item of the labels list in the sidebar
 */
angular.module('biigle.annotations').directive('labelsListItem', function (mapAnnotations) {
		"use strict";

		return {
            restrict: 'A',
			controller: function ($scope) {
                var opened = false;

                var hasSelectedAnnotation = function () {
                    var annotations = $scope.item.annotations;
                    for (var i = annotations.length - 1; i >= 0; i--) {
                        if (mapAnnotations.isAnnotationSelected(annotations[i].annotation)) {
                            return true;
                        }
                    }

                    return false;
                };

                var isSelected = function () {
                    return opened || hasSelectedAnnotation();
                };

                $scope.getClass = function () {
                    return {
                        'selected': isSelected()
                    };
                };

                $scope.isSelected = isSelected;

                $scope.toggleOpen = function () {
                    opened = !opened;
                };
			}
		};
	}
);
