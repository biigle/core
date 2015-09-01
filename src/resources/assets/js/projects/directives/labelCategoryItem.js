/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectLabelCategoryItem
 * @memberOf dias.projects
 * @description A label category list item.
 */
angular.module('dias.projects').directive('projectLabelCategoryItem', function ($compile, $timeout) {
		"use strict";

		return {
			restrict: 'C',

			templateUrl: 'label-item.html',

			scope: true,

			link: function (scope, element, attrs) {
				// wait for this element to be rendered until the children are
				// appended, otherwise there would be too much recursion for
				// angular
				var content = angular.element('<ul class="project-label-category-subtree list-unstyled"><li class="project-label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, \'text-danger\': removing}" data-ng-repeat="item in categoriesTree[item.id]"></li></ul>');
				$timeout(function () {
					element.append($compile(content)(scope));
				});
			},

			controller: function ($scope) {
				// open the subtree of this item
				$scope.isOpen = false;
				// this item has children
				$scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
				// this item is currently selected
				$scope.isSelected = false;

                $scope.removing = false;

                $scope.startRemove = function () {
                    $scope.removing = true;
                };

                $scope.cancelRemove = function () {
                    $scope.removing = false;
                };

				// handle this by the event rather than an own click handler to
				// deal with click and search field actions in a unified way
				$scope.$on('categories.selected', function (e, category) {
					// if an item is selected, its subtree and all parent items
					// should be opened
					if ($scope.item.id === category.id) {
						$scope.isOpen = true;
						$scope.isSelected = true;
						// this hits all parent scopes/items
						$scope.$emit('categories.openParents');
					} else {
						$scope.isOpen = false;
						$scope.isSelected = false;
					}
				});

				// if a child item was selected, this item should be opened, too
				// so the selected item becomes visible in the tree
				$scope.$on('categories.openParents', function (e) {
					$scope.isOpen = true;
					// stop propagation if this is a root element
					if ($scope.item.parent_id === null) {
						e.stopPropagation();
					}
				});

                // check, if item still has children
                $scope.$on('categories.refresh', function (e) {
                    if ($scope.isExpandable) {
                        $scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
                    }
                });
			}
		};
	}
);
