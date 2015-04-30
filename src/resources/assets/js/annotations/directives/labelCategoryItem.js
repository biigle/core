/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name labelCategoryItem
 * @memberOf dias.annotations
 * @description A label category list item.
 */
angular.module('dias.annotations').directive('labelCategoryItem', function ($compile) {
		"use strict";

		return {
			restrict: 'C',
			template: '<span class="item__name" data-ng-click="select()">{{item.name}}</span>',
			scope: true,
			link: function (scope, element, attrs) {
				scope.isOpen = false;
				scope.isExpandable = !!scope.categories[scope.item.id];
				var isAppended = false;

				var content = angular.element('<ul class="label-category-subtree list-unstyled"><li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: (selectedID == item.id)}" data-ng-repeat="item in categories[item.id]"></li></ul>');
				var compiled = $compile(content)(scope);

				scope.select = function () {
					scope.selectItem(scope.item);
					
					if (!isAppended) {
						// do this with compile to conditionally resolve the child
						// directives. otherwise there would be too much recursion!
						element.append(compiled);
						scope.isOpen = true;
						isAppended = true;
					} else {
						scope.isOpen = !scope.isOpen;
					}
				};
			}
		};
	}
);
