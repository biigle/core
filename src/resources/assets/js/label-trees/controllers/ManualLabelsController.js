/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name ManualLabelsController
 * @memberOf dias.label-trees
 * @description Controller for manually adding labels to the label tree
 */
angular.module('dias.label-trees').controller('ManualLabelsController', function ($scope) {
        "use strict";

        var DEFAULTS = {
            LABEL: null,
            COLOR: '#0099ff',
            NAME: ''
        };

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: DEFAULTS.COLOR,
            name: DEFAULTS.NAME
        };

        var handleLabelCreateSuccess = function () {
            $scope.resetName();
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

        $scope.isNameDirty = function () {
            return $scope.selected.name !== DEFAULTS.NAME;
        };

        $scope.isParentDirty = function () {
            return $scope.selected.label !== DEFAULTS.LABEL;
        };

        $scope.isColorDirty = function () {
            return $scope.selected.color !== DEFAULTS.COLOR;
        };

        $scope.addLabel = function () {
            var label = {
                name: $scope.selected.name,
                color: $scope.selected.color
            };

            if ($scope.selected.label) {
                label.parent_id = $scope.selected.label.id;
            }

            $scope.createLabel(label).then(handleLabelCreateSuccess);
        };

        $scope.$on('labels.selected', function (e, label) {
            $scope.selected.label = label;
        });
    }
);
