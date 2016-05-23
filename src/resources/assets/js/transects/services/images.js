/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', function ($rootScope, TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filter, sort, THUMB_DIMENSION) {
        "use strict";

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';

        // the currently displayed ordering of images (as array of image IDs)
        var sequence = [];

        var grid = {
            cols: 0,
            rows: 0
        };

        var margin = 8;

        var offset = 0;

        // check for a stored image sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, sequence);
        }

        this.updateSequence = function () {
            var shouldStore = false;

            if (sort.isActive()) {
                shouldStore = true;
                angular.copy(sort.getSequence(), sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(sequence, TRANSECT_IMAGES, true);
            } else {
                angular.copy(TRANSECT_IMAGES, sequence);
            }

            if (filter.hasRules()) {
                shouldStore = true;
                filterSubset(sequence, filter.getSequence());
            }

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }

            $rootScope.$broadcast('transects.images.updated');
        };

        this.progress = function () {
            return offset / sequence.length;
        };

        this.updateGrid = function (width, height) {
            grid.cols = Math.floor(width / (THUMB_DIMENSION.WIDTH + margin));
            grid.rows = Math.floor(height / (THUMB_DIMENSION.HEIGHT + margin));
        };

        this.scrollRows = function (delta) {
            offset = Math.max(0, Math.min(
                sequence.length - grid.cols * grid.rows,
                offset + grid.cols * delta
            ));
        };

        this.getSequence = function () {
            return sequence.slice(offset, offset + grid.cols * grid.rows);
        };

        this.getRows = function () {
            return grid.rows;
        };

        this.getCols = function () {
            return grid.cols;
        };
    }
);
