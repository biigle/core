/**
 * @namespace dias.admin
 * @description The DIAS admin AngularJS module.
 */
angular.module('dias.admin', ['dias.api', 'dias.ui.messages']);

/**
 * @namespace dias.admin
 * @ngdoc controller
 * @name AdminLabelsController
 * @memberOf dias.admin
 * @description Handles modification of the global labels.
 */
angular.module('dias.admin').controller('AdminLabelsController', ["$scope", "Label", "msg", function ($scope, Label, msg) {
		"use strict";

        var defaultLabelColor = '#0099ff';

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
            project_id: $scope.projectId,
            color: defaultLabelColor
        };

        // currently selected label
        $scope.selected = {
            label: null
        };

        $scope.resetColor = function () {
            $scope.newLabel.color = defaultLabelColor;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9BZG1pbkxhYmVsc0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGNBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsY0FBQSxXQUFBLG9EQUFBLFVBQUEsUUFBQSxPQUFBLEtBQUE7RUFDQTs7UUFFQSxJQUFBLG9CQUFBOztRQUVBLElBQUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsTUFBQTtZQUNBLElBQUEsT0FBQSxlQUFBLFNBQUE7Z0JBQ0EsT0FBQSxlQUFBLFFBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLGVBQUEsVUFBQSxDQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLE1BQUEsTUFBQSxZQUFBO2dCQUNBLE9BQUEsaUJBQUE7Z0JBQ0EsT0FBQSxPQUFBLFFBQUE7Ozs7UUFJQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsV0FBQTtZQUNBLE1BQUE7WUFDQSxZQUFBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxXQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsUUFBQTs7O1FBR0EsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLFlBQUEsT0FBQSxLQUFBLEtBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLFNBQUEsVUFBQSxJQUFBOztZQUVBLE1BQUEsT0FBQSxDQUFBLElBQUEsSUFBQSxPQUFBLE9BQUEsWUFBQTtnQkFDQSxJQUFBLE9BQUEsU0FBQSxNQUFBLE9BQUEsSUFBQTtvQkFDQSxPQUFBLFdBQUE7O2dCQUVBOzs7O1FBSUEsT0FBQSxXQUFBLFlBQUE7WUFDQSxNQUFBLElBQUEsT0FBQSxVQUFBLFVBQUEsVUFBQTtnQkFDQSxPQUFBLE9BQUEsS0FBQTtnQkFDQSxVQUFBO2dCQUNBLE9BQUEsV0FBQTtnQkFDQSxPQUFBLFNBQUEsT0FBQTtlQUNBLElBQUE7Ozs7Ozs7Ozs7OztBQzlEQSxRQUFBLE9BQUEsY0FBQSxVQUFBLHFFQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsT0FBQSxTQUFBOztnQkFFQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7O2dCQUVBLE9BQUEsYUFBQTs7Z0JBRUEsT0FBQSxXQUFBOztnQkFFQSxPQUFBLGNBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7OztnQkFHQSxPQUFBLGVBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSx1QkFBQSxVQUFBLEdBQUEsWUFBQTs7O29CQUdBLElBQUEsT0FBQSxLQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFNBQUE7d0JBQ0EsT0FBQSxhQUFBOzt3QkFFQSxPQUFBLE1BQUE7MkJBQ0E7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7Ozs7O2dCQU1BLE9BQUEsSUFBQSwwQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxTQUFBOztvQkFFQSxJQUFBLE9BQUEsS0FBQSxjQUFBLE1BQUE7d0JBQ0EsRUFBQTs7Ozs7Z0JBS0EsT0FBQSxJQUFBLHNCQUFBLFVBQUEsR0FBQTtvQkFDQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7Ozs7OztBQU1BIiwiZmlsZSI6ImFkbWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhZG1pbiBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hZG1pbicsIFsnZGlhcy5hcGknLCAnZGlhcy51aS5tZXNzYWdlcyddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFkbWluXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQWRtaW5MYWJlbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hZG1pblxuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSBnbG9iYWwgbGFiZWxzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hZG1pbicpLmNvbnRyb2xsZXIoJ0FkbWluTGFiZWxzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExhYmVsLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZGVmYXVsdExhYmVsQ29sb3IgPSAnIzAwOTlmZic7XG5cbiAgICAgICAgdmFyIGJ1aWxkVHJlZSA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlZnJlc2hMYWJlbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxzID0gTGFiZWwucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IHt9O1xuICAgICAgICAgICAgICAgICRzY29wZS5sYWJlbHMuZm9yRWFjaChidWlsZFRyZWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVmcmVzaExhYmVscygpO1xuXG4gICAgICAgIC8vIGxhYmVsIHRoYXQgc2hvdWxkIGJlIG5ld2x5IGNyZWF0ZWQgb24gc3VibWl0XG4gICAgICAgICRzY29wZS5uZXdMYWJlbCA9IHtcbiAgICAgICAgICAgIHBhcmVudF9pZDogbnVsbCxcbiAgICAgICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgICAgICBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkLFxuICAgICAgICAgICAgY29sb3I6IGRlZmF1bHRMYWJlbENvbG9yXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3VycmVudGx5IHNlbGVjdGVkIGxhYmVsXG4gICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHtcbiAgICAgICAgICAgIGxhYmVsOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlc2V0Q29sb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwuY29sb3IgPSBkZWZhdWx0TGFiZWxDb2xvcjtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQubGFiZWwgPSBpdGVtO1xuICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLnBhcmVudF9pZCA9IGl0ZW0gPyBpdGVtLmlkIDogbnVsbDtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgJHNjb3BlLm5ld0xhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgLy8gYWx3YXlzIHVzZSBmb3JjZSBoZXJlIGJlY2F1c2UgdGhlIHVzZXIgYWxyZWFkeSBoYWQgdG8gY29uZmlybSBkZWxldGlvblxuICAgICAgICAgICAgTGFiZWwuZGVsZXRlKHtpZDogaWQsIGZvcmNlOiB0cnVlfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc2VsZWN0ZWQubGFiZWwuaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWZyZXNoTGFiZWxzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBMYWJlbC5hZGQoJHNjb3BlLm5ld0xhYmVsLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFiZWxzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGJ1aWxkVHJlZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMucmVmcmVzaCcpO1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXdMYWJlbC5uYW1lID0gJyc7XG4gICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hZG1pblxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgYWRtaW5MYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nKS5kaXJlY3RpdmUoJ2FkbWluTGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICEhJHNjb3BlLmNhdGVnb3JpZXNUcmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXNlciBjbGlja2VkIG9uIHRoZSAneCcgYnV0dG9uXG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdGhpcyBieSB0aGUgZXZlbnQgcmF0aGVyIHRoYW4gYW4gb3duIGNsaWNrIGhhbmRsZXIgdG9cbiAgICAgICAgICAgICAgICAvLyBkZWFsIHdpdGggY2xpY2sgYW5kIHNlYXJjaCBmaWVsZCBhY3Rpb25zIGluIGEgdW5pZmllZCB3YXlcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgZnVuY3Rpb24gKGUsIGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjaywgaWYgaXRlbSBzdGlsbCBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnJlZnJlc2gnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
