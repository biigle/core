/**
 * @namespace biigle.volumes
 * @ngdoc service
 * @name images
 * @memberOf biigle.volumes
 * @description Service managing the list of images to display
 */
angular.module('biigle.volumes').service('images', function (VOLUME_ID, VOLUME_IMAGES, filterSubset, filter, sort, THUMB_DIMENSION, urlParams, debounce) {
        "use strict";

        var imagesLocalStorageKey = 'biigle.volumes.' + VOLUME_ID + '.images';
        var offsetLocalStorageKey = 'biigle.volumes.' + VOLUME_ID + '.offset';

        // the currently displayed ordering of images (as array of image IDs)
        var sequence = [];

        // check for a stored image sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the volume.
            // some of them may have been deleted in the meantime.
            filterSubset(sequence, VOLUME_IMAGES);
        } else {
            angular.copy(VOLUME_IMAGES, sequence);
        }

        var grid = {
            cols: 0,
            rows: 0
        };

        var margin = 8;

        var DEFAULT_OFFSET = 0;
        var offset = null;

        // part of the sequence that is currently displayed
        var sequenceWindow = [];

        var updateSequenceWindow = function () {
            sequenceWindow = sequence.slice(offset, offset + grid.cols * grid.rows);
        };

        // number of the topmost row of the last "page"
        var lastRow = 0;

        var updateLastRow = function () {
            lastRow = Math.ceil(sequence.length / grid.cols) - grid.rows;
            // if the offset was already initialized
            if (offset !== null) {
                // update offset based on new lastRow constraint
                setOffset(offset);
            }
        };

        var updateSequence = function () {
            var shouldStore = false;

            if (sort.isActive()) {
                shouldStore = true;
                angular.copy(sort.getSequence(), sequence);
                // take only those IDs that actually belong to the volume
                // (e.g. when IDs are taken from local storage but the volume has changed)
                filterSubset(sequence, VOLUME_IMAGES);
            } else {
                angular.copy(VOLUME_IMAGES, sequence);
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
            offset = Math.max(0, Math.min(lastRow * grid.cols, o));
            updateSequenceWindow();

            if (offset === DEFAULT_OFFSET) {
                window.localStorage.removeItem(offsetLocalStorageKey);
                urlParams.unset('offset');
            } else if (Number.isInteger(offset)) {
                window.localStorage[offsetLocalStorageKey] = offset;
                urlParams.set({offset: offset});
            }
        };

        this.updateSorting = function () {
            updateSequence();
        };

        this.updateFiltering = function () {
            updateSequence();
            updateLastRow();
        };

        this.progress = function () {
            return Math.max(0, Math.min(1, offset / (sequence.length - (grid.cols * grid.rows))));
        };

        this.updateGrid = function (width, height) {
            grid.cols = Math.floor(width / (THUMB_DIMENSION.WIDTH + margin));
            grid.rows = Math.floor(height / (THUMB_DIMENSION.HEIGHT + margin));
            updateSequenceWindow();
            updateLastRow();
        };

        this.scrollRows = function (delta) {
            setOffset(offset + grid.cols * delta);
        };

        this.scrollToPercent = function (percent) {
            // the percentage from 0 to 1 goes from row 0 to the topmost row
            // of the last "page" and *not* to the very last row
            setOffset(grid.cols * Math.round(lastRow * percent));
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

        // determine if an image is displayed in the right half of the image grid
        this.isImageInRightHalf = function (id) {
            var index = sequenceWindow.indexOf(id);
            if (index !== -1) {
                return (index % grid.cols) >= (grid.cols / 2);
            }

            // image is not displayed
            return false;
        };

        this.initialize = function () {
            // url parameter has precedence over local storage
            if (urlParams.get('offset') !== undefined) {
                setOffset(parseInt(urlParams.get('offset')));
            } else if (window.localStorage[offsetLocalStorageKey]) {
                setOffset(parseInt(window.localStorage[offsetLocalStorageKey]));
            } else {
                setOffset(DEFAULT_OFFSET);
            }
        };

    }
);
