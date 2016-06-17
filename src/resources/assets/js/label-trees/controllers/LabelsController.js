/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name LabelsController
 * @memberOf dias.label-trees
 * @description Controller for the interactive label tree
 */
angular.module('dias.label-trees').controller('LabelsController', function ($scope, LABELS, LABEL_TREE, Label, msg) {
        "use strict";

        var editing = false;

        var loading = false;

        var DEFAULTS = {
            LABEL: null,
            COLOR: '#0099ff',
            NAME: ''
        };

        $scope.tree = {};

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: DEFAULTS.COLOR,
            name: DEFAULTS.NAME
        };

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        $scope.openHierarchy = [];

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var buildTree = function () {
            $scope.tree = {};
            LABELS.forEach(function (label) {
                var parent = label.parent_id;
                if ($scope.tree[parent]) {
                    $scope.tree[parent].push(label);
                } else {
                    $scope.tree[parent] = [label];
                }
            });
        };

        var labelAdded = function (label) {
            LABELS.push(label);
            buildTree();
            $scope.$broadcast('labels.refresh');
            $scope.resetName();
            loading = false;
        };

        var labelDeleted = function (label) {
            for (var i = LABELS.length - 1; i >= 0; i--) {
                if (LABELS[i].id === label.id) {
                    LABELS.splice(i, 1);
                    break;
                }
            }
            buildTree();

            if ($scope.selected.label && $scope.selected.label.id === label.id) {
                $scope.selected.label = null;
            }

            $scope.selectLabel($scope.selected.label);
            loading = false;
        };

        var getLabel = function (id) {
            for (var i = LABELS.length - 1; i >= 0; i--) {
                if (LABELS[i].id === id) {
                    return LABELS[i];
                }
            }

            return null;
        };

        var updateOpenHierarchy = function (label) {
            var currentLabel = label;
            $scope.openHierarchy.length = 0;

            if (!currentLabel) return;

            while (currentLabel.parent_id !== null) {
                $scope.openHierarchy.unshift(currentLabel.parent_id);
                currentLabel = getLabel(currentLabel.parent_id);
            }
        };

        $scope.selectLabel = function (label) {
            updateOpenHierarchy(label);
            $scope.selected.label = label;
            $scope.$broadcast('labels.selected');
        };

        $scope.hasLabels = function () {
            return LABELS.length > 0;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.getLabels = function () {
            return LABELS;
        };

        $scope.resetParent = function () {
            $scope.selectLabel(DEFAULTS.LABEL);
        };

        $scope.resetColor = function () {
            $scope.selected.color = DEFAULTS.COLOR;
        };

        $scope.resetName = function () {
            $scope.selected.name = DEFAULTS.NAME;
        };

        $scope.addLabel = function () {
            loading = true;
            var label = {
                name: $scope.selected.name,
                color: $scope.selected.color,
                label_tree_id: LABEL_TREE.id
            };
            if ($scope.selected.label) {
                label.parent_id = $scope.selected.label.id;
            }
            Label.create(label, labelAdded, handleError);
        };

        $scope.removeLabel = function (label, e) {
            loading = true;
            e.stopPropagation();
            Label.delete({id: label.id}, function () {
                labelDeleted(label);
            }, handleError);
        };

        $scope.isLoading = function () {
            return loading;
        };

        buildTree();
    }
);
