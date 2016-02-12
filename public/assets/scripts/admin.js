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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9BZG1pbkxhYmVsc0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGNBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsY0FBQSxXQUFBLG9EQUFBLFVBQUEsUUFBQSxPQUFBLEtBQUE7RUFDQTs7UUFFQSxJQUFBLG9CQUFBOztRQUVBLElBQUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsTUFBQTtZQUNBLElBQUEsT0FBQSxlQUFBLFNBQUE7Z0JBQ0EsT0FBQSxlQUFBLFFBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLGVBQUEsVUFBQSxDQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLE1BQUEsTUFBQSxZQUFBO2dCQUNBLE9BQUEsaUJBQUE7Z0JBQ0EsT0FBQSxPQUFBLFFBQUE7Ozs7UUFJQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsV0FBQTtZQUNBLE1BQUE7WUFDQSxZQUFBO1lBQ0EsT0FBQTs7OztRQUlBLE9BQUEsV0FBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLFFBQUE7OztRQUdBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsU0FBQSxZQUFBLE9BQUEsS0FBQSxLQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBLE9BQUEsU0FBQTs7O1FBR0EsT0FBQSxTQUFBLFVBQUEsSUFBQTs7WUFFQSxNQUFBLE9BQUEsQ0FBQSxJQUFBLElBQUEsT0FBQSxPQUFBLFlBQUE7Z0JBQ0EsSUFBQSxPQUFBLFNBQUEsTUFBQSxPQUFBLElBQUE7b0JBQ0EsT0FBQSxXQUFBOztnQkFFQTs7OztRQUlBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsTUFBQSxJQUFBLE9BQUEsVUFBQSxVQUFBLFVBQUE7Z0JBQ0EsT0FBQSxPQUFBLEtBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxPQUFBLFdBQUE7Z0JBQ0EsT0FBQSxTQUFBLE9BQUE7ZUFDQSxJQUFBOzs7Ozs7Ozs7Ozs7QUM5REEsUUFBQSxPQUFBLGNBQUEsVUFBQSxxRUFBQSxVQUFBLFVBQUEsVUFBQSxnQkFBQTtRQUNBOztRQUVBLE9BQUE7WUFDQSxVQUFBOztZQUVBLGFBQUE7O1lBRUEsT0FBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7Z0JBSUEsSUFBQSxVQUFBLFFBQUEsUUFBQSxlQUFBLElBQUE7Z0JBQ0EsU0FBQSxZQUFBO29CQUNBLFFBQUEsT0FBQSxTQUFBLFNBQUE7Ozs7WUFJQSx1QkFBQSxVQUFBLFFBQUE7O2dCQUVBLE9BQUEsU0FBQTs7Z0JBRUEsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOztnQkFFQSxPQUFBLGFBQUE7O2dCQUVBLE9BQUEsV0FBQTs7Z0JBRUEsT0FBQSxjQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7Z0JBR0EsT0FBQSxlQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7OztnQkFLQSxPQUFBLElBQUEsdUJBQUEsVUFBQSxHQUFBLFlBQUE7OztvQkFHQSxJQUFBLE9BQUEsS0FBQSxPQUFBLFlBQUE7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7d0JBRUEsT0FBQSxNQUFBOzJCQUNBO3dCQUNBLE9BQUEsU0FBQTt3QkFDQSxPQUFBLGFBQUE7Ozs7OztnQkFNQSxPQUFBLElBQUEsMEJBQUEsVUFBQSxHQUFBO29CQUNBLE9BQUEsU0FBQTs7b0JBRUEsSUFBQSxPQUFBLEtBQUEsY0FBQSxNQUFBO3dCQUNBLEVBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSxzQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOzs7Ozs7QUFNQSIsImZpbGUiOiJhZG1pbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFkbWluXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYWRtaW4gQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWkubWVzc2FnZXMnXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hZG1pblxuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFkbWluTGFiZWxzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYWRtaW5cbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgZ2xvYmFsIGxhYmVscy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYWRtaW4nKS5jb250cm9sbGVyKCdBZG1pbkxhYmVsc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBMYWJlbCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRMYWJlbENvbG9yID0gJyMwMDk5ZmYnO1xuXG4gICAgICAgIHZhciBidWlsZFRyZWUgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZWZyZXNoTGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmxhYmVscyA9IExhYmVsLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSB7fTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFiZWxzLmZvckVhY2goYnVpbGRUcmVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJlZnJlc2hMYWJlbHMoKTtcblxuICAgICAgICAvLyBsYWJlbCB0aGF0IHNob3VsZCBiZSBuZXdseSBjcmVhdGVkIG9uIHN1Ym1pdFxuICAgICAgICAkc2NvcGUubmV3TGFiZWwgPSB7XG4gICAgICAgICAgICBwYXJlbnRfaWQ6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgcHJvamVjdF9pZDogbnVsbCxcbiAgICAgICAgICAgIGNvbG9yOiBkZWZhdWx0TGFiZWxDb2xvclxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGN1cnJlbnRseSBzZWxlY3RlZCBsYWJlbFxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSB7XG4gICAgICAgICAgICBsYWJlbDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZXNldENvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLmNvbG9yID0gZGVmYXVsdExhYmVsQ29sb3I7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmxhYmVsID0gaXRlbTtcbiAgICAgICAgICAgICRzY29wZS5uZXdMYWJlbC5wYXJlbnRfaWQgPSBpdGVtID8gaXRlbS5pZCA6IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsICRzY29wZS5uZXdMYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIC8vIGFsd2F5cyB1c2UgZm9yY2UgaGVyZSBiZWNhdXNlIHRoZSB1c2VyIGFscmVhZHkgaGFkIHRvIGNvbmZpcm0gZGVsZXRpb25cbiAgICAgICAgICAgIExhYmVsLmRlbGV0ZSh7aWQ6IGlkLCBmb3JjZTogdHJ1ZX0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkLmxhYmVsLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbShudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVmcmVzaExhYmVscygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZExhYmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTGFiZWwuYWRkKCRzY29wZS5uZXdMYWJlbCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxhYmVscy5wdXNoKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBidWlsZFRyZWUocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnJlZnJlc2gnKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwubmFtZSA9ICcnO1xuICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYWRtaW5cbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFkbWluTGFiZWxDYXRlZ29yeUl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFkbWluXG4gKiBAZGVzY3JpcHRpb24gQSBsYWJlbCBjYXRlZ29yeSBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFkbWluJykuZGlyZWN0aXZlKCdhZG1pbkxhYmVsQ2F0ZWdvcnlJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAhISRzY29wZS5jYXRlZ29yaWVzVHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGlzIGN1cnJlbnRseSBzZWxlY3RlZFxuICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhlIHVzZXIgY2xpY2tlZCBvbiB0aGUgJ3gnIGJ1dHRvblxuICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeUlkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGl0ZW0gaXMgc2VsZWN0ZWQsIGl0cyBzdWJ0cmVlIGFuZCBhbGwgcGFyZW50IGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBvcGVuZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLmlkID09PSBjYXRlZ29yeUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaGl0cyBhbGwgcGFyZW50IHNjb3Blcy9pdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBhIGNoaWxkIGl0ZW0gd2FzIHNlbGVjdGVkLCB0aGlzIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZCwgdG9vXG4gICAgICAgICAgICAgICAgLy8gc28gdGhlIHNlbGVjdGVkIGl0ZW0gYmVjb21lcyB2aXNpYmxlIGluIHRoZSB0cmVlXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5vcGVuUGFyZW50cycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHByb3BhZ2F0aW9uIGlmIHRoaXMgaXMgYSByb290IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLnBhcmVudF9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2ssIGlmIGl0ZW0gc3RpbGwgaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5yZWZyZXNoJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICEhJHNjb3BlLmNhdGVnb3JpZXNUcmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
