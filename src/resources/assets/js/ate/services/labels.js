/**
 * @namespace dias.ate
 * @ngdoc service
 * @name labels
 * @memberOf dias.ate
 * @description Service managing the list of labels. This service overrides the labels service of dias.transects!
 */
angular.module('dias.ate').service('labels', function (LABEL_TREES, USER_ID, IS_ADMIN, AnnotationLabel, $q) {
        "use strict";

        // cache the already requested attached image labels here
        // this is a map from image ID to a list of image labels attached to the image
        var attachedLabelCache = {};

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

        // add attached labels to the label cache if the labels already were queried
        var handleAttachedLabel = function (id, label) {
            if (attachedLabelCache.hasOwnProperty(id)) {
                attachedLabelCache[id].unshift(label);
            }
        };

        var handleDetachedLabel = function (id, label) {
            if (attachedLabelCache.hasOwnProperty(id)) {
                var labels = attachedLabelCache[id];
                for (var i = labels.length - 1; i >= 0; i--) {
                    if (labels[i].id === label.id) {
                        labels.splice(i, 1);
                        break;
                    }
                }
            }
        };

        var restoreDetachedLabel = function (id, label) {
            if (attachedLabelCache.hasOwnProperty(id)) {
                attachedLabelCache[id].push(label);
            }
        };

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

        this.attachToImage = function (id) {
            if (selectedLabel) {
                return AnnotationLabel.attach({
                    label_id: selectedLabel.id,
                    confidence: 1.0,
                    annotation_id: id
                }, function (label) {
                    handleAttachedLabel(id, label);
                }).$promise;
            } else {
                var deferred = $q.defer();
                deferred.reject({data: {message: 'No label selected.'}});
                return deferred.promise;
            }
        };

        this.getAttachedLabels = function (id) {
            if (!attachedLabelCache.hasOwnProperty(id)) {
                attachedLabelCache[id] = AnnotationLabel.query({annotation_id: id});
            }

            return attachedLabelCache[id];
        };

        this.canDetachLabel = function (label) {
            return IS_ADMIN || label.user.id === USER_ID;
        };

        this.detachLabel = function (id, label) {
            handleDetachedLabel(id, label);
            return AnnotationLabel.delete({id: label.id}, angular.noop, function () {
                // adds the detached label back to the image labels list if anything went
                // wrong when detaching the label
                restoreDetachedLabel(id, label);
            }).$promise;
        };

        init();
    }
);
