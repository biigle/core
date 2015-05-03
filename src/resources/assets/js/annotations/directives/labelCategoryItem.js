/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name labelCategoryItem
 * @memberOf dias.annotations
 * @description A label category list item.
 */
angular.module('dias.annotations').directive('labelCategoryItem', function ($compile, $timeout) {
		"use strict";

		return {
			restrict: 'C',

			template: '<span class="item__name" data-ng-click="selectItem(item)">{{item.name}}</span>',

			scope: true,

			link: function (scope, element, attrs) {
				// wait for this element to be rendered until the children are
				// appended, otherwise there would be too much recursion for 
				// angular
				var content = angular.element('<ul class="label-category-subtree list-unstyled"><li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in categoriesTree[item.id]"></li></ul>');
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
			}
		};
	}
);
