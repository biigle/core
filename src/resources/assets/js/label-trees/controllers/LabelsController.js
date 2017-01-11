/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name LabelsController
 * @memberOf biigle.label-trees
 * @description Controller for the interactive label tree
 */
angular.module('biigle.label-trees').controller('LabelsController', function ($scope, LABELS, LABEL_TREE, Label, msg, $q) {
        "use strict";

        var editing = false;

        var loading = false;

        var selectedLabel = null;

        $scope.tree = {};

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

        var handleCreateLabelSuccess = function (labels) {
            Array.prototype.push.apply(LABELS, labels);
            buildTree();
            $scope.$broadcast('labels.refresh');
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
            $scope.$broadcast('labels.refresh');

            if (selectedLabel && selectedLabel.id === label.id) {
                // select the parent if the currently selected label was deleted
                selectedLabel = getLabel(label.parent_id);
            }

            $scope.selectLabel(selectedLabel);
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
            selectedLabel = label;
            updateOpenHierarchy(label);
            $scope.$broadcast('labels.selected', label);
        };

        $scope.isSelectedLabel = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
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

        $scope.createLabel = function (label) {
            // prevent users from accidentally adding a label twice
            if (loading) {
                var deferred = $q.defer();
                deferred.resolve([]);
                return deferred.promise;
            }

            loading = true;
            label.label_tree_id = LABEL_TREE.id;
            return Label.create(label, handleCreateLabelSuccess, handleError).$promise;
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

        $scope.startLoading = function () {
            loading = true;
        };

        $scope.stopLoading = function () {
            loading = false;
        };

        buildTree();
    }
);
