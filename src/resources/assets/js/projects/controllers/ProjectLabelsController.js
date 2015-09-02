/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectLabelsController
 * @memberOf dias.projects
 * @description Handles modification of the labels of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectLabelsController', function ($scope, ProjectLabel, Label, msg) {
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
            $scope.labels = ProjectLabel.query({project_id: $scope.projectId}, function () {
                $scope.categoriesTree = {};
                $scope.labels.forEach(buildTree);
                $scope.selectItem($scope.selectedItem);
            });
        };

        refreshLabels();

        $scope.newLabel = {
            parent_id: null,
            name: null,
            project_id: $scope.projectId
        };

        $scope.edit = function () {
            $scope.editing = !$scope.editing;
        };

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;
            $scope.newLabel.parent_id = (item) ? item.id : null;
            $scope.$broadcast('categories.selected', item);
        };

        $scope.remove = function (item) {
            // always use force here because the user already had to confirm deletion
            Label.delete({id: item.id, force: true}, function () {
                if ($scope.selectedItem.id === item.id) {
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
	}
);
