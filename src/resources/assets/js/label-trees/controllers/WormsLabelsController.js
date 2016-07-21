/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name WormsLabelsController
 * @memberOf dias.label-trees
 * @description Controller for importing labels from WoRMS
 */
angular.module('dias.label-trees').controller('WormsLabelsController', function ($scope, LabelSource, LABEL_SOURCES, msg, randomColor) {
        "use strict";

        // WoRMS label source
        var source = (function () {
            for (var i = LABEL_SOURCES.length - 1; i >= 0; i--) {
                if (LABEL_SOURCES[i].name === 'worms') {
                    return LABEL_SOURCES[i];
                }
            }
        })();

        var DEFAULTS = {
            LABEL: null,
            NAME: ''
        };

        var findResults = [];
        // is the search query currently being processed?
        var finding = false;

        // is the recursive option activated?
        var recursive = false;

        // source_id of all labels that were imported in this session
        var importedIds = [];

        var handleFindError = function (response) {
            finding = false;
            $scope.stopLoading();
            msg.responseError(response);
        };

        var handleFindSuccess = function () {
            finding = false;
            $scope.stopLoading();
        };

        var addImportedIds = function (labels) {
            for (var i = labels.length - 1; i >= 0; i--) {
                importedIds.push(parseInt(labels[i].source_id));
            }

            // don't refresh the color if new labels should get the same color than the
            // selected (parent) label
            if (!$scope.selected.label || ('#' + $scope.selected.label.color) !== $scope.selected.color) {
                $scope.refreshColor();
            }
        };

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: randomColor.get(),
            name: DEFAULTS.NAME
        };

        $scope.getFindResults = function () {
            return findResults;
        };

        $scope.isFinding = function () {
            return finding;
        };

        $scope.hasFindResults = function () {
            return findResults.length > 0;
        };

        $scope.find = function () {
            finding = true;
            $scope.startLoading();
            findResults = LabelSource.query(
                {id: source.id, query: $scope.selected.name},
                handleFindSuccess,
                handleFindError
            );
        };

        $scope.getClassification = function (item) {
            return item.parents.join(' > ');
        };

        $scope.resetParent = function () {
            $scope.selectLabel(DEFAULTS.LABEL);
        };

        $scope.refreshColor = function () {
            $scope.selected.color = randomColor.get();
        };

        $scope.isNameDirty = function () {
            return $scope.selected.name !== DEFAULTS.NAME;
        };

        $scope.isParentDirty = function () {
            return $scope.selected.label !== DEFAULTS.LABEL;
        };

        $scope.toggleRecursive = function () {
            recursive = !recursive;
        };

        $scope.isRecursive = function () {
            return recursive;
        };

        $scope.addLabel = function (item) {
            var label = {
                name: item.name,
                color: $scope.selected.color,
                source_id: item.aphia_id,
                label_source_id: source.id
            };

            if (recursive) {
                label.recursive = 'true';
            } else if ($scope.selected.label) {
                label.parent_id = $scope.selected.label.id;
            }

            $scope.createLabel(label).then(addImportedIds);
        };

        $scope.getAddButtonTitle = function (item) {
            if ($scope.isRecursive()) {
                return 'Add ' + item.name + ' and all WoRMS parents as new labels';
            }

            if ($scope.isParentDirty()) {
                return 'Add ' + item.name + ' as a child of ' + $scope.selected.label.name;
            }

            return 'Add ' + item.name + ' as a root label';
        };

        $scope.hasBeenImported = function (item) {
            return importedIds.indexOf(item.aphia_id) !== -1;
        };

        $scope.$on('labels.selected', function (e, label) {
            $scope.selected.label = label;
            if (label) {
                $scope.selected.color = '#' + label.color;
            }
        });
    }
);
