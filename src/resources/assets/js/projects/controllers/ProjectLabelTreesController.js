/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectLabelTreesController
 * @memberOf dias.projects
 * @description Handles modification of the labels of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectLabelTreesController', function ($scope, PROJECT_ID, ProjectLabelTree, msg) {
		"use strict";

        var editing = false;
        var usedTrees = [];
        var availableTrees;

        var newTrees = [];

        var loading = false;

        $scope.selected = {
            tree: null
        };

        var treeIsNotUsed = function (tree) {
            return usedTrees.indexOf(tree.id) === -1;
        };

        var treeAttached = function (tree) {
            $scope.addUsedTree(tree.id);
            newTrees.push(tree);
            $scope.selected.tree = null;
            loading = false;
        };

        var treeDetached = function (tree) {
            usedTrees.splice(usedTrees.indexOf(tree.id), 1);
            var item = document.getElementById('label-tree-item-' + tree.id);
            if (item) {
                item.remove();
            } else {
                for (var i = newTrees.length - 1; i >= 0; i--) {
                    if (newTrees[i].id === tree.id) {
                        newTrees.splice(i, 1);
                        break;
                    }
                }
            }

            loading = false;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.toggleEditing = function () {
            editing = !editing;

            if (!availableTrees) {
                availableTrees =  ProjectLabelTree.available({project_id: PROJECT_ID});
            }
        };

        $scope.attachLabelTree = function (tree) {
            if (!tree || tree.id === undefined) return;

            if (treeIsNotUsed(tree)) {
                ProjectLabelTree.attach({project_id: PROJECT_ID}, tree, treeAttached, msg.responseError);
                loading = true;
            }
        };

        $scope.getAvailableTrees = function () {
            return availableTrees.filter(treeIsNotUsed);
        };

        $scope.addUsedTree = function (id) {
            usedTrees.push(id);
        };

        $scope.getNewTrees = function () {
            return newTrees;
        };

        $scope.hasNewTrees = function () {
            return newTrees.length > 0;
        };

        $scope.detachLabelTree = function (id) {
            ProjectLabelTree.detach({project_id: PROJECT_ID}, {id: id}, treeDetached, msg.responseError);
            loading = true;
        };
	}
);
