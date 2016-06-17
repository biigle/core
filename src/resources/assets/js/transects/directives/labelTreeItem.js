/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name labelTreeItem
 * @memberOf dias.transects
 * @description A label tree list item.
 */
angular.module('dias.transects').directive('labelTreeItem', function ($compile, $timeout, $templateCache) {
        "use strict";

        return {
            restrict: 'C',

            templateUrl: 'label-tree-item.html',

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
                // open the subtree of this item
                var open = false;
                // this item has children
                var expandable = false;
                // this item is currently selected
                var selected = false;

                var checkState = function () {
                    if ($scope.treeItemIsOpen($scope.item)) {
                        open = true;
                        selected = false;
                    } else if ($scope.treeItemIsSelected($scope.item)) {
                        open = true;
                        selected = true;
                    } else {
                        open = false;
                        selected = false;
                    }
                };

                var checkExpandable = function () {
                    expandable = $scope.tree && !!$scope.tree[$scope.item.id];
                };

                $scope.getSubtree = function () {
                    if (open && $scope.tree) {
                        return $scope.tree[$scope.item.id];
                    }

                    return [];
                };


                $scope.getClass = function () {
                    return {
                        open: open,
                        expandable: expandable,
                        selected: selected
                    };
                };

                $scope.$on('labels.selected', checkState);
                checkState();
                checkExpandable();
            }
        };
    }
);
