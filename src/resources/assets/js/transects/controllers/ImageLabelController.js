/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImageLabelController
 * @memberOf dias.transects
 * @description Manages the image label feature
 */
angular.module('dias.transects').controller('ImageLabelController', function ($scope, LABEL_TREES, TRANSECT_ID, keyboard) {
        "use strict";

        var labels = [];

        // data structure used to build the tree display. for each label tree there is
        // a map of label IDs to the child label objects
        var treesCompiled = {};

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        var openHierarchy = [];

        var selectedLabel = null;

        // favourite labels that can be selected with the hotkeys
        var favourites = [];
        var maxFavourites = 9;
        var favouritesStorageKey = 'dias.transects.' + TRANSECT_ID + '.label-favourites';
        // callback functions for the favourites key events
        var favouriteCallbacks = [];

        var init = function () {
            var i;
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

            for (i = LABEL_TREES.length - 1; i >= 0; i--) {
                name = LABEL_TREES[i].name;
                treesCompiled[name] = {};
                LABEL_TREES[i].labels.forEach(compileTree);
                labels = labels.concat(LABEL_TREES[i].labels);
            }

            // load favourite labels from storage
            var tmp = window.localStorage.getItem(favouritesStorageKey);
            if (tmp) {
                tmp = JSON.parse(tmp);
                favourites = labels.filter(function (label) {
                    return tmp.indexOf(label.id) !== -1;
                });
            }

            var makeCallback = function (index) {
                return function () {
                    selectFavourite(index);
                };
            };

            // initialize favourite callbacks
            for (i = 0; i <= maxFavourites; i++) {
                favouriteCallbacks.push(makeCallback(i));
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

        var selectFavourite = function (index) {
            if (index >= 0 && index < favourites.length) {
                $scope.selectLabel(favourites[index]);
                $scope.$apply();
            }
        };

        $scope.selected = {
            searchLabel: null
        };

        $scope.hotkeysMap = ['𝟭', '𝟮', '𝟯', '𝟰', '𝟱', '𝟲', '𝟳', '𝟴', '𝟵'];

        $scope.getLabels = function () {
            return labels;
        };

        $scope.getLabelTrees = function () {
            return treesCompiled;
        };

        $scope.selectLabel = function (label) {
            updateOpenHierarchy(label);
            selectedLabel = label;
            $scope.selected.searchLabel = '';
            $scope.$broadcast('labels.selected');
        };

        $scope.treeItemIsOpen = function (label) {
            return openHierarchy.indexOf(label.id) !== -1;
        };

        $scope.treeItemIsSelected = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
        };

        $scope.hasFavourites = function () {
            return favourites.length > 0;
        };

        $scope.favouritesLeft = function () {
            return favourites.length < maxFavourites;
        };

        $scope.getFavourites = function () {
            return favourites;
        };

        $scope.isFavourite = function (label) {
            return favourites.indexOf(label) !== -1;
        };

        $scope.toggleFavourite = function (e, label) {
            e.stopPropagation();
            var index = favourites.indexOf(label);
            if (index === -1 && favourites.length < maxFavourites) {
                favourites.push(label);
            } else {
                favourites.splice(index, 1);
            }

            if (favourites.length > 0) {
                var tmp = favourites.map(function (label) {
                    return label.id;
                });
                window.localStorage.setItem(favouritesStorageKey, JSON.stringify(tmp));
            } else {
                window.localStorage.removeItem(favouritesStorageKey);
            }
        };

        $scope.$on('label-mode.toggle', function (e, isLabelMode) {
            var i;
            if (!isLabelMode) {
                $scope.selectLabel(null);
                for (i = 0; i <= maxFavourites; i++) {
                    keyboard.off((i + 1).toString(), favouriteCallbacks[i]);
                }
            } else {
                for (i = 0; i <= maxFavourites; i++) {
                    keyboard.on((i + 1).toString(), favouriteCallbacks[i]);
                }
            }
        });

        init();
    }
);
