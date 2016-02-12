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
            $scope.labels = ProjectLabel.query({project_id: $scope.projectId}, function () {
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

        $scope.edit = function () {
            $scope.editing = !$scope.editing;
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
            }, msg.responseError);
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
