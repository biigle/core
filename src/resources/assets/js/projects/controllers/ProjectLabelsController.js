/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectLabelsController
 * @memberOf dias.projects
 * @description Handles modification of the labels of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectLabelsController', function ($scope, ProjectLabel, Label) {
		"use strict";

        $scope.edit = function () {
            $scope.editing = !$scope.editing;
        };

        var labels = ProjectLabel.query({project_id: $scope.projectId}, function () {
            var tree = {};
            var build = function (label) {
                var parent = label.parent_id;
                if (tree[parent]) {
                    tree[parent].push(label);
                } else {
                    tree[parent] = [label];
                }
            };

            labels.forEach(build);
            $scope.categoriesTree = tree;
        });

        $scope.selectItem = function (item) {
            // labels.setSelected(item);
            // $scope.searchCategory = ''; // clear search field
            $scope.$broadcast('categories.selected', item);
        };

        $scope.remove = function (item) {
            // always use force here because the user already had to confirm deletion
            Label.delete({id: item.id, force: true}, function () {
                // remove item
                var index = $scope.categoriesTree[item.parent_id].indexOf(item);
                $scope.categoriesTree[item.parent_id].splice(index, 1);
                // remove parent subtree if this was the last child
                // (so the tree can be emptied completely)
                if ($scope.categoriesTree[item.parent_id].length === 0) {
                    $scope.categoriesTree[item.parent_id] = undefined;
                }
                // remove subtree
                $scope.categoriesTree[item.id] = undefined;
                $scope.$broadcast('categories.refresh');
            });
        };

        $scope.$watch('categoriesTree', function (categoriesTree) {
            $scope.noItems = !categoriesTree || categoriesTree[null] === undefined;
        }, true);
	}
);
