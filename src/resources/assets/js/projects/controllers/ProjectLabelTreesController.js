/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectLabelTreesController
 * @memberOf dias.projects
 * @description Handles modification of the labels of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectLabelTreesController', function ($scope, PROJECT, LABEL_TREES, ProjectLabelTree, msg) {
		"use strict";

        var editing = false;
        var availableTrees;

        var loading = false;

        $scope.selected = {
            tree: null
        };

        var treeIsNotUsed = function (tree) {
            for (var i = LABEL_TREES.length - 1; i >= 0; i--) {
                if (LABEL_TREES[i].id === tree.id) {
                    return false;
                }
            }

            return true;
        };

        var treeAttached = function (tree) {
            LABEL_TREES.push(tree);
            $scope.selected.tree = null;
            loading = false;
        };

        var treeDetached = function (tree) {
            for (var i = LABEL_TREES.length - 1; i >= 0; i--) {
                if (LABEL_TREES[i].id === tree.id) {
                    LABEL_TREES.splice(i, 1);
                    break;
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
                availableTrees =  ProjectLabelTree.available({project_id: PROJECT.id});
            }
        };

        $scope.getTrees = function () {
            return LABEL_TREES;
        };

        $scope.attachLabelTree = function (tree) {
            if (!tree || tree.id === undefined) return;

            if (treeIsNotUsed(tree)) {
                ProjectLabelTree.attach(
                    {project_id: PROJECT.id},
                    {id: tree.id},
                    function () {
                        treeAttached(tree);
                    },
                    msg.responseError
                );
                loading = true;
            }
        };

        $scope.getAvailableTrees = function () {
            return availableTrees.filter(treeIsNotUsed);
        };

        $scope.detachLabelTree = function (tree) {
            ProjectLabelTree.detach(
                {project_id: PROJECT.id},
                {id: tree.id},
                treeDetached,
                msg.responseError
            );
            loading = true;
        };
	}
);
