/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name ManualLabelsController
 * @memberOf dias.label-trees
 * @description Controller for manually adding labels to the label tree
 */
angular.module('dias.label-trees').controller('ManualLabelsController', function ($scope, randomColor) {
        "use strict";

        var DEFAULTS = {
            LABEL: null,
            NAME: ''
        };

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: randomColor.get(),
            name: DEFAULTS.NAME
        };

        var handleLabelCreateSuccess = function () {
            $scope.resetName();

            // don't refresh the color if new labels should get the same color than the
            // selected (parent) label
            if (!$scope.selected.label || ('#' + $scope.selected.label.color) !== $scope.selected.color) {
                $scope.refreshColor();
            }
        };

        $scope.resetParent = function () {
            $scope.selectLabel(DEFAULTS.LABEL);
        };

        $scope.refreshColor = function () {
            $scope.selected.color = randomColor.get();
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
            if (label) {
                $scope.selected.color = '#' + label.color;
            }
        });
    }
);
