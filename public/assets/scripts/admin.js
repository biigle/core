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
            project_id: null,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIiwiY29udHJvbGxlcnMvQWRtaW5MYWJlbHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGNBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsY0FBQSxVQUFBLHFFQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsT0FBQSxTQUFBOztnQkFFQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7O2dCQUVBLE9BQUEsYUFBQTs7Z0JBRUEsT0FBQSxXQUFBOztnQkFFQSxPQUFBLGNBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7OztnQkFHQSxPQUFBLGVBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSx1QkFBQSxVQUFBLEdBQUEsWUFBQTs7O29CQUdBLElBQUEsT0FBQSxLQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFNBQUE7d0JBQ0EsT0FBQSxhQUFBOzt3QkFFQSxPQUFBLE1BQUE7MkJBQ0E7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7Ozs7O2dCQU1BLE9BQUEsSUFBQSwwQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxTQUFBOztvQkFFQSxJQUFBLE9BQUEsS0FBQSxjQUFBLE1BQUE7d0JBQ0EsRUFBQTs7Ozs7Z0JBS0EsT0FBQSxJQUFBLHNCQUFBLFVBQUEsR0FBQTtvQkFDQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7O0FDbEVBLFFBQUEsT0FBQSxjQUFBLFdBQUEsb0RBQUEsVUFBQSxRQUFBLE9BQUEsS0FBQTtFQUNBOztRQUVBLElBQUEsb0JBQUE7O1FBRUEsSUFBQSxZQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsU0FBQSxNQUFBO1lBQ0EsSUFBQSxPQUFBLGVBQUEsU0FBQTtnQkFDQSxPQUFBLGVBQUEsUUFBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsZUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsTUFBQSxNQUFBLFlBQUE7Z0JBQ0EsT0FBQSxpQkFBQTtnQkFDQSxPQUFBLE9BQUEsUUFBQTs7OztRQUlBOzs7UUFHQSxPQUFBLFdBQUE7WUFDQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFlBQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxXQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsUUFBQTs7O1FBR0EsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLFlBQUEsT0FBQSxLQUFBLEtBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLFNBQUEsVUFBQSxJQUFBOztZQUVBLE1BQUEsT0FBQSxDQUFBLElBQUEsSUFBQSxPQUFBLE9BQUEsWUFBQTtnQkFDQSxJQUFBLE9BQUEsU0FBQSxNQUFBLE9BQUEsSUFBQTtvQkFDQSxPQUFBLFdBQUE7O2dCQUVBOzs7O1FBSUEsT0FBQSxXQUFBLFlBQUE7WUFDQSxNQUFBLElBQUEsT0FBQSxVQUFBLFVBQUEsVUFBQTtnQkFDQSxPQUFBLE9BQUEsS0FBQTtnQkFDQSxVQUFBO2dCQUNBLE9BQUEsV0FBQTtnQkFDQSxPQUFBLFNBQUEsT0FBQTtlQUNBLElBQUE7Ozs7QUFJQSIsImZpbGUiOiJhZG1pbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFkbWluXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYWRtaW4gQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWkubWVzc2FnZXMnXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hZG1pblxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgYWRtaW5MYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nKS5kaXJlY3RpdmUoJ2FkbWluTGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICEhJHNjb3BlLmNhdGVnb3JpZXNUcmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXNlciBjbGlja2VkIG9uIHRoZSAneCcgYnV0dG9uXG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdGhpcyBieSB0aGUgZXZlbnQgcmF0aGVyIHRoYW4gYW4gb3duIGNsaWNrIGhhbmRsZXIgdG9cbiAgICAgICAgICAgICAgICAvLyBkZWFsIHdpdGggY2xpY2sgYW5kIHNlYXJjaCBmaWVsZCBhY3Rpb25zIGluIGEgdW5pZmllZCB3YXlcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgZnVuY3Rpb24gKGUsIGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjaywgaWYgaXRlbSBzdGlsbCBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnJlZnJlc2gnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hZG1pblxuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFkbWluTGFiZWxzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgZ2xvYmFsIGxhYmVscy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nKS5jb250cm9sbGVyKCdBZG1pbkxhYmVsc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBMYWJlbCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRMYWJlbENvbG9yID0gJyMwMDk5ZmYnO1xuXG4gICAgICAgIHZhciBidWlsZFRyZWUgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZWZyZXNoTGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmxhYmVscyA9IExhYmVsLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSB7fTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFiZWxzLmZvckVhY2goYnVpbGRUcmVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJlZnJlc2hMYWJlbHMoKTtcblxuICAgICAgICAvLyBsYWJlbCB0aGF0IHNob3VsZCBiZSBuZXdseSBjcmVhdGVkIG9uIHN1Ym1pdFxuICAgICAgICAkc2NvcGUubmV3TGFiZWwgPSB7XG4gICAgICAgICAgICBwYXJlbnRfaWQ6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgcHJvamVjdF9pZDogbnVsbCxcbiAgICAgICAgICAgIGNvbG9yOiBkZWZhdWx0TGFiZWxDb2xvclxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGN1cnJlbnRseSBzZWxlY3RlZCBsYWJlbFxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSB7XG4gICAgICAgICAgICBsYWJlbDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZXNldENvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLmNvbG9yID0gZGVmYXVsdExhYmVsQ29sb3I7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmxhYmVsID0gaXRlbTtcbiAgICAgICAgICAgICRzY29wZS5uZXdMYWJlbC5wYXJlbnRfaWQgPSBpdGVtID8gaXRlbS5pZCA6IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsICRzY29wZS5uZXdMYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIC8vIGFsd2F5cyB1c2UgZm9yY2UgaGVyZSBiZWNhdXNlIHRoZSB1c2VyIGFscmVhZHkgaGFkIHRvIGNvbmZpcm0gZGVsZXRpb25cbiAgICAgICAgICAgIExhYmVsLmRlbGV0ZSh7aWQ6IGlkLCBmb3JjZTogdHJ1ZX0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkLmxhYmVsLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbShudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVmcmVzaExhYmVscygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZExhYmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTGFiZWwuYWRkKCRzY29wZS5uZXdMYWJlbCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxhYmVscy5wdXNoKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBidWlsZFRyZWUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnJlZnJlc2gnKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwubmFtZSA9ICcnO1xuICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
