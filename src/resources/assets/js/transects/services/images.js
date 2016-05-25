/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', function (TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filter, sort, THUMB_DIMENSION, urlParams, debounce) {
        "use strict";

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';
        var offsetLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.offset';

        // the currently displayed ordering of images (as array of image IDs)
        var sequence = [];

        // check for a stored image sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, sequence);
        }

        var grid = {
            cols: 0,
            rows: 0
        };

        var margin = 8;

        var DEFAULT_OFFSET = 0;
        var offset = DEFAULT_OFFSET;

        // part of the sequence that is currently displayed
        var sequenceWindow = [];

        var updateSequenceWindow = function () {
            sequenceWindow = sequence.slice(offset, offset + grid.cols * grid.rows);
        };

        var updateSequence = function () {
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

            updateSequenceWindow();

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }
        };

        var setOffset = function (o) {
            offset = Math.max(0, Math.min(sequence.length - grid.cols * grid.rows, o));
            updateSequenceWindow();

            if (offset === DEFAULT_OFFSET) {
                window.localStorage.removeItem(offsetLocalStorageKey);
                urlParams.unset('offset');
            } else {
                window.localStorage[offsetLocalStorageKey] = offset;
                urlParams.set({offset: offset});
            }
        };

        this.updateSorting = function () {
            updateSequence();
        };

        this.updateFiltering = function () {
            updateSequence();
            setOffset(DEFAULT_OFFSET);
        };

        this.progress = function () {
            return Math.max(0, Math.min(1, (offset + grid.cols * grid.rows) / sequence.length));
        };

        this.updateGrid = function (width, height) {
            grid.cols = Math.floor(width / (THUMB_DIMENSION.WIDTH + margin));
            grid.rows = Math.floor(height / (THUMB_DIMENSION.HEIGHT + margin));
            updateSequenceWindow();
        };

        this.scrollRows = function (delta) {
            setOffset(offset + grid.cols * delta);
        };

        this.getSequence = function () {
            return sequenceWindow;
        };

        this.getRows = function () {
            return grid.rows;
        };

        this.getCols = function () {
            return grid.cols;
        };

        this.getLength = function () {
            return sequence.length;
        };

        // url parameter has precedence over local storage
        if (urlParams.get('offset') !== undefined) {
            setOffset(parseInt(urlParams.get('offset')));
        } else if (window.localStorage[offsetLocalStorageKey]) {
            setOffset(parseInt(window.localStorage[offsetLocalStorageKey]));
        }
    }
);
