/**
 * @namespace biigle.largo
 * @ngdoc service
 * @name labels
 * @memberOf biigle.largo
 * @description Service managing the list of labels. This service overrides the labels service of biigle.volumes!
 */
angular.module('biigle.largo').service('labels', function (LABEL_TREES) {
        "use strict";

        var labels = [];

        // data structure used to build the tree display. for each label tree there is
        // a map of label IDs to the child label objects
        var treesCompiled = {};

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        var openHierarchy = [];

        var selectedLabel = null;

        var init = function () {
            // parse label trees to spcial data format for display
            var name;
            var compileTree = function (label) {
                var parent = label.parent_id;
                if (treesCompiled[name][parent]) {
                    treesCompiled[name][parent].push(label);
                } else {
                    treesCompiled[name][parent] = [label];
                }
            };

            for (var i = LABEL_TREES.length - 1; i >= 0; i--) {
                name = LABEL_TREES[i].name;
                treesCompiled[name] = {};
                LABEL_TREES[i].labels.forEach(compileTree);
                labels = labels.concat(LABEL_TREES[i].labels);
            }
        };

        var getLabel = function (id) {
            for (var i = labels.length - 1; i >= 0; i--) {
                if (labels[i].id === id) {
                    return labels[i];
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

        this.getLabel = getLabel;

        this.getLabels = function () {
            return labels;
        };

        this.getLabelTrees = function () {
            return treesCompiled;
        };

        this.selectLabel = function (label) {
            updateOpenHierarchy(label);
            selectedLabel = label;
        };

        this.treeItemIsOpen = function (label) {
            return openHierarchy.indexOf(label.id) !== -1;
        };

        this.treeItemIsSelected = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
        };

        this.getSelectedLabel = function () {
            return selectedLabel;
        };

        this.hasSelectedLabel = function () {
            return selectedLabel !== null;
        };

        init();
    }
);
