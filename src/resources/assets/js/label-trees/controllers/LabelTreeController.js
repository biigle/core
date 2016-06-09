/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name LabelTreeController
 * @memberOf dias.label-trees
 * @description Controller for the label tree information
 */
angular.module('dias.label-trees').controller('LabelTreeController', function ($scope,  LABEL_TREE, LabelTree, msg) {
        "use strict";

        var editing = false;
        var saving = false;

        $scope.labelTreeInfo = {
            name: LABEL_TREE.name,
            description: LABEL_TREE.description,
            visibility_id: LABEL_TREE.visibility_id.toString()
        };

        var handleSavingError = function (response) {
            meg.responseError(response);
            saving = false;
        };

        var infoUpdated = function (tree) {
            LABEL_TREE.name = tree.name;
            LABEL_TREE.description = tree.description;
            LABEL_TREE.visibility_id = parseInt(tree.visibility_id);
            editing = false;
            saving = false;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isSaving = function () {
            return saving;
        };

        $scope.getVisibilityId = function () {
            return LABEL_TREE.visibility_id;
        };

        $scope.getName = function () {
            return LABEL_TREE.name;
        };

        $scope.getDescription = function () {
            return LABEL_TREE.description;
        };

        $scope.saveChanges = function () {
            saving = true;
            LabelTree.update({
                id: LABEL_TREE.id,
                name: $scope.labelTreeInfo.name,
                description: $scope.labelTreeInfo.description,
                visibility_id: parseInt($scope.labelTreeInfo.visibility_id)
            }, infoUpdated, handleSavingError);
        };

        $scope.discardChanges = function () {
            $scope.labelTreeInfo.name = LABEL_TREE.name;
            $scope.labelTreeInfo.description = LABEL_TREE.description;
            $scope.labelTreeInfo.visibility_id = LABEL_TREE.visibility_id.toString();
            editing = false;
        };
    }
);
