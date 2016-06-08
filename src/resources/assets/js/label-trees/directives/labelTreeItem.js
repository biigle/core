/**
 * @namespace dias.label-trees
 * @ngdoc directive
 * @name labelTreeItem
 * @memberOf dias.label-trees
 * @description A label tree item.
 */
angular.module('dias.label-trees').directive('labelTreeItem', function ($compile, $timeout, $templateCache) {
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

            controller: function ($scope) {
                var isExpandable = function () {
                    return $scope.tree && !!$scope.tree[$scope.item.id];
                };

                // open the subtree of this item
                var open = false;
                // this item has children
                var expandable = isExpandable();
                // this item is currently selected
                var selected = false;


                $scope.getClass = function () {
                    return {
                        open: open,
                        expandable: expandable,
                        selected: selected
                    };
                };

                // handle this by the event rather than an own click handler to
                // deal with click and search field actions in a unified way
                $scope.$on('labels.selected', function (e, id) {
                    // if an item is selected, its subtree and all parent items
                    // should be opened
                    if ($scope.item.id === id) {
                        open = true;
                        selected = true;
                        // this hits all parent scopes/items
                        $scope.$emit('labels.openParents');
                    } else {
                        open = false;
                        selected = false;
                    }
                });

                // if a child item was selected, this item should be opened, too
                // so the selected item becomes visible in the tree
                $scope.$on('labels.openParents', function (e) {
                    open = true;
                    // stop propagation if this is a root element
                    if ($scope.item.parent_id === null) {
                        e.stopPropagation();
                    }
                });

                $scope.$on('labels.refresh', function () {
                    expandable = isExpandable();
                });
            }
        };
    }
);
