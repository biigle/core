/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name labels
 * @memberOf biigle.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('biigle.annotations').service('labels', function (AnnotationLabel, LABEL_TREES) {
        "use strict";

        var selectedLabel;
        var currentConfidence = 1.0;

        var trees = LABEL_TREES;
        var treesCompiled = {};
        var labelsList = [];

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        var openHierarchy = [];

        var init = function () {
            var treeName = null;
            var buildTree = function (label) {
                var parent = label.parent_id;
                if (treesCompiled[treeName][parent]) {
                    treesCompiled[treeName][parent].push(label);
                } else {
                    treesCompiled[treeName][parent] = [label];
                }
            };

            for (var i = trees.length - 1; i >= 0; i--) {
                treeName = trees[i].name;
                treesCompiled[treeName] = {};
                trees[i].labels.forEach(buildTree);
                labelsList = labelsList.concat(trees[i].labels);
            }
        };

        var getLabel = function (id) {
            for (var i = labelsList.length - 1; i >= 0; i--) {
                if (labelsList[i].id === id) {
                    return labelsList[i];
                }
            }

            return null;
        };

        var updateOpenHierarchy = function (label) {
            var currentLabel = label;
            openHierarchy.length = 0;

            if (!currentLabel) return;

            while (currentLabel.parent_id !== null) {
                openHierarchy.unshift(currentLabel.parent_id);
                currentLabel = getLabel(currentLabel.parent_id);
            }
        };

        this.fetchForAnnotation = function (annotation) {
            if (!annotation) return;

            // don't fetch twice
            if (!annotation.labels) {
                annotation.labels = AnnotationLabel.query({
                    annotation_id: annotation.id
                });
            }

            return annotation.labels;
        };

        this.getTree = function () {
            return treesCompiled;
        };

        this.getList = function () {
            return labelsList;
        };

        this.setSelected = function (label) {
            selectedLabel = label;
            updateOpenHierarchy(label);
        };

        this.getSelected = function () {
            return selectedLabel;
        };

        this.hasSelected = function () {
            return !!selectedLabel;
        };

        this.getSelectedId = function () {
            return selectedLabel ? selectedLabel.id : null;
        };

        this.setCurrentConfidence = function (confidence) {
            currentConfidence = confidence;
        };

        this.getCurrentConfidence = function () {
            return currentConfidence;
        };

        this.isOpen = function (label) {
            return openHierarchy.indexOf(label.id) !== -1;
        };

        this.isSelected = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
        };

        init();
    }
);
