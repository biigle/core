/**
 * @namespace dias.admin
 * @description The DIAS admin AngularJS module.
 */
angular.module('dias.admin', ['dias.api', 'dias.ui.messages']);

/**
 * @namespace dias.admin
 * @ngdoc directive
 * @name adminLabelCategoryItem
 * @memberOf dias.admin
 * @description A label category list item.
 */
angular.module('dias.admin').directive('adminLabelCategoryItem', ["$compile", "$timeout", "$templateCache", function ($compile, $timeout, $templateCache) {
        "use strict";

        return {
            restrict: 'C',

            templateUrl: 'label-item.html',

            scope: true,

            link: function (scope, element, attrs) {
                // wait for this element to be rendered until the children are
                // appended, otherwise there would be too much recursion for
                // angular
                var content = angular.element($templateCache.get('label-subtree.html'));
                $timeout(function () {
                    element.append($compile(content)(scope));
                });
            },

            controller: ["$scope", function ($scope) {
                // open the subtree of this item
                $scope.isOpen = false;
                // this item has children
                $scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
                // this item is currently selected
                $scope.isSelected = false;
                // the user clicked on the 'x' button
                $scope.removing = false;

                $scope.startRemove = function () {
                    $scope.removing = true;
                };

                $scope.cancelRemove = function () {
                    $scope.removing = false;
                };

                // handle this by the event rather than an own click handler to
                // deal with click and search field actions in a unified way
                $scope.$on('categories.selected', function (e, categoryId) {
                    // if an item is selected, its subtree and all parent items
                    // should be opened
                    if ($scope.item.id === categoryId) {
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
                    $scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
                });
            }]
        };
    }]
);

/**
 * @namespace dias.admin
 * @ngdoc controller
 * @name AdminLabelsController
 * @memberOf dias.admin
 * @description Handles modification of the global labels.
 */
angular.module('dias.admin').controller('AdminLabelsController', ["$scope", "Label", "msg", function ($scope, Label, msg) {
		"use strict";

        var buildTree = function (label) {
            var parent = label.parent_id;
            if ($scope.categoriesTree[parent]) {
                $scope.categoriesTree[parent].push(label);
            } else {
                $scope.categoriesTree[parent] = [label];
            }
        };

        var refreshLabels = function () {
            $scope.labels = Label.query(function () {
                $scope.categoriesTree = {};
                $scope.labels.forEach(buildTree);
            });
        };

        refreshLabels();

        // label that should be newly created on submit
        $scope.newLabel = {
            parent_id: null,
            name: null,
            project_id: $scope.projectId
        };

        // currently selected label
        $scope.selected = {
            label: null
        };

        $scope.selectItem = function (item) {
            $scope.selected.label = item;
            $scope.newLabel.parent_id = item ? item.id : null;
            $scope.$broadcast('categories.selected', $scope.newLabel.parent_id);
        };

        $scope.remove = function (id) {
            // always use force here because the user already had to confirm deletion
            Label.delete({id: id, force: true}, function () {
                if ($scope.selected.label.id === id) {
                    $scope.selectItem(null);
                }
                refreshLabels();
            });
        };

        $scope.addLabel = function () {
            Label.add($scope.newLabel, function (response) {
                $scope.labels.push(response);
                buildTree(response);
                $scope.$broadcast('categories.refresh');
                $scope.newLabel.name = '';
            }, msg.responseError);
        };
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIiwiY29udHJvbGxlcnMvQWRtaW5MYWJlbHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGNBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsY0FBQSxVQUFBLHFFQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsT0FBQSxTQUFBOztnQkFFQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7O2dCQUVBLE9BQUEsYUFBQTs7Z0JBRUEsT0FBQSxXQUFBOztnQkFFQSxPQUFBLGNBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7OztnQkFHQSxPQUFBLGVBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSx1QkFBQSxVQUFBLEdBQUEsWUFBQTs7O29CQUdBLElBQUEsT0FBQSxLQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFNBQUE7d0JBQ0EsT0FBQSxhQUFBOzt3QkFFQSxPQUFBLE1BQUE7MkJBQ0E7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7Ozs7O2dCQU1BLE9BQUEsSUFBQSwwQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxTQUFBOztvQkFFQSxJQUFBLE9BQUEsS0FBQSxjQUFBLE1BQUE7d0JBQ0EsRUFBQTs7Ozs7Z0JBS0EsT0FBQSxJQUFBLHNCQUFBLFVBQUEsR0FBQTtvQkFDQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7O0FDbEVBLFFBQUEsT0FBQSxjQUFBLFdBQUEsb0RBQUEsVUFBQSxRQUFBLE9BQUEsS0FBQTtFQUNBOztRQUVBLElBQUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsTUFBQTtZQUNBLElBQUEsT0FBQSxlQUFBLFNBQUE7Z0JBQ0EsT0FBQSxlQUFBLFFBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLGVBQUEsVUFBQSxDQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLE1BQUEsTUFBQSxZQUFBO2dCQUNBLE9BQUEsaUJBQUE7Z0JBQ0EsT0FBQSxPQUFBLFFBQUE7Ozs7UUFJQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsV0FBQTtZQUNBLE1BQUE7WUFDQSxZQUFBLE9BQUE7Ozs7UUFJQSxPQUFBLFdBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxTQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsWUFBQSxPQUFBLEtBQUEsS0FBQTtZQUNBLE9BQUEsV0FBQSx1QkFBQSxPQUFBLFNBQUE7OztRQUdBLE9BQUEsU0FBQSxVQUFBLElBQUE7O1lBRUEsTUFBQSxPQUFBLENBQUEsSUFBQSxJQUFBLE9BQUEsT0FBQSxZQUFBO2dCQUNBLElBQUEsT0FBQSxTQUFBLE1BQUEsT0FBQSxJQUFBO29CQUNBLE9BQUEsV0FBQTs7Z0JBRUE7Ozs7UUFJQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE1BQUEsSUFBQSxPQUFBLFVBQUEsVUFBQSxVQUFBO2dCQUNBLE9BQUEsT0FBQSxLQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsT0FBQSxXQUFBO2dCQUNBLE9BQUEsU0FBQSxPQUFBO2VBQ0EsSUFBQTs7OztBQUlBIiwiZmlsZSI6ImFkbWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhZG1pbiBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hZG1pbicsIFsnZGlhcy5hcGknLCAnZGlhcy51aS5tZXNzYWdlcyddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFkbWluXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBhZG1pbkxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hZG1pblxuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hZG1pbicpLmRpcmVjdGl2ZSgnYWRtaW5MYWJlbENhdGVnb3J5SXRlbScsIGZ1bmN0aW9uICgkY29tcGlsZSwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0MnLFxuXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhYmVsLWl0ZW0uaHRtbCcsXG5cbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhpcyBlbGVtZW50IHRvIGJlIHJlbmRlcmVkIHVudGlsIHRoZSBjaGlsZHJlbiBhcmVcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmRlZCwgb3RoZXJ3aXNlIHRoZXJlIHdvdWxkIGJlIHRvbyBtdWNoIHJlY3Vyc2lvbiBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCdsYWJlbC1zdWJ0cmVlLmh0bWwnKSk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShjb250ZW50KShzY29wZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIHN1YnRyZWUgb2YgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoZSB1c2VyIGNsaWNrZWQgb24gdGhlICd4JyBidXR0b25cbiAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGhpdHMgYWxsIHBhcmVudCBzY29wZXMvaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2F0ZWdvcmllcy5vcGVuUGFyZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgYSBjaGlsZCBpdGVtIHdhcyBzZWxlY3RlZCwgdGhpcyBpdGVtIHNob3VsZCBiZSBvcGVuZWQsIHRvb1xuICAgICAgICAgICAgICAgIC8vIHNvIHRoZSBzZWxlY3RlZCBpdGVtIGJlY29tZXMgdmlzaWJsZSBpbiB0aGUgdHJlZVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCBwcm9wYWdhdGlvbiBpZiB0aGlzIGlzIGEgcm9vdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5wYXJlbnRfaWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrLCBpZiBpdGVtIHN0aWxsIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMucmVmcmVzaCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAhISRzY29wZS5jYXRlZ29yaWVzVHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFkbWluXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQWRtaW5MYWJlbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hZG1pblxuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSBnbG9iYWwgbGFiZWxzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hZG1pbicpLmNvbnRyb2xsZXIoJ0FkbWluTGFiZWxzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExhYmVsLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYnVpbGRUcmVlID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVmcmVzaExhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbHMgPSBMYWJlbC5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0ge307XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxhYmVscy5mb3JFYWNoKGJ1aWxkVHJlZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWZyZXNoTGFiZWxzKCk7XG5cbiAgICAgICAgLy8gbGFiZWwgdGhhdCBzaG91bGQgYmUgbmV3bHkgY3JlYXRlZCBvbiBzdWJtaXRcbiAgICAgICAgJHNjb3BlLm5ld0xhYmVsID0ge1xuICAgICAgICAgICAgcGFyZW50X2lkOiBudWxsLFxuICAgICAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgICAgIHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjdXJyZW50bHkgc2VsZWN0ZWQgbGFiZWxcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0ge1xuICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQubGFiZWwgPSBpdGVtO1xuICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLnBhcmVudF9pZCA9IGl0ZW0gPyBpdGVtLmlkIDogbnVsbDtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgJHNjb3BlLm5ld0xhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgLy8gYWx3YXlzIHVzZSBmb3JjZSBoZXJlIGJlY2F1c2UgdGhlIHVzZXIgYWxyZWFkeSBoYWQgdG8gY29uZmlybSBkZWxldGlvblxuICAgICAgICAgICAgTGFiZWwuZGVsZXRlKHtpZDogaWQsIGZvcmNlOiB0cnVlfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc2VsZWN0ZWQubGFiZWwuaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWZyZXNoTGFiZWxzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBMYWJlbC5hZGQoJHNjb3BlLm5ld0xhYmVsLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFiZWxzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGJ1aWxkVHJlZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMucmVmcmVzaCcpO1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXdMYWJlbC5uYW1lID0gJyc7XG4gICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
