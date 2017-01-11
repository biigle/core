/**
 * @namespace biigle.transects
 * @ngdoc controller
 * @name ImageLabelController
 * @memberOf biigle.transects
 * @description Manages the image label feature
 */
angular.module('biigle.transects').controller('ImageLabelController', function ($scope, labels, TRANSECT_ID, keyboard) {
        "use strict";

        // favourite labels that can be selected with the hotkeys
        var favourites = [];
        var maxFavourites = 9;
        var favouritesStorageKey = 'biigle.transects.' + TRANSECT_ID + '.label-favourites';
        // callback functions for the favourites key events
        var favouriteCallbacks = [];

        var init = function () {
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
            for (var i = 0; i <= maxFavourites; i++) {
                favouriteCallbacks.push(makeCallback(i));
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

        $scope.getLabels = labels.getLabels;

        $scope.getLabelTrees = labels.getLabelTrees;

        $scope.selectLabel = function (label) {
            labels.selectLabel(label);
            $scope.selected.searchLabel = '';
            $scope.$broadcast('labels.selected');
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
