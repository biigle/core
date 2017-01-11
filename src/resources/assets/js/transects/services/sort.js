/**
 * @namespace biigle.transects
 * @ngdoc service
 * @name sort
 * @memberOf biigle.transects
 * @description Service managing the image sorting of the transect index page
 */
angular.module('biigle.transects').service('sort', function (TRANSECT_ID, TRANSECT_IMAGES) {
        "use strict";

        var sorterLocalStorageKey = 'biigle.transects.' + TRANSECT_ID + '.sorting.sorter';
        var sequenceLocalStorageKey = 'biigle.transects.' + TRANSECT_ID + '.sorting.sequence';
        var directionLocalStorageKey = 'biigle.transects.' + TRANSECT_ID + '.sorting.direction';

        var ASCENDING = 'asc';
        var DESCENDING = 'desc';

        var DEFAULTS = {
            DIRECTION: ASCENDING,
            SORTER: 'filename',
            SEQUENCE: TRANSECT_IMAGES
        };

        var direction = window.localStorage.getItem(directionLocalStorageKey);
        if (!direction) {
            direction = DEFAULTS.DIRECTION;
        }

        var sorter = window.localStorage.getItem(sorterLocalStorageKey);
        if (!sorter) {
            sorter = DEFAULTS.SORTER;
        }

        var sequence = JSON.parse(window.localStorage.getItem(sequenceLocalStorageKey));
        if (!sequence) {
            sequence = DEFAULTS.SEQUENCE;
        }

        var updateDirection = function (d) {
            direction = d;
            if (direction === DEFAULTS.DIRECTION) {
                window.localStorage.removeItem(directionLocalStorageKey);
            } else {
                window.localStorage.setItem(directionLocalStorageKey, direction);
            }
        };

        this.setAscending = function () {
            updateDirection(ASCENDING);
        };

        this.setDescending = function () {
            updateDirection(DESCENDING);
        };

        this.isAscending = function () {
            return direction === ASCENDING;
        };

        this.isDescending = function () {
            return direction === DESCENDING;
        };

        this.isSorterActive = function (s) {
            return sorter === s;
        };

        this.isActive = function () {
            return (sorter !== DEFAULTS.SORTER) || (direction !== DEFAULTS.DIRECTION);
        };

        this.reset = function () {
            sorter = DEFAULTS.SORTER;
            window.localStorage.removeItem(sorterLocalStorageKey);
            sequence = DEFAULTS.SEQUENCE;
            window.localStorage.removeItem(sequenceLocalStorageKey);
            direction = DEFAULTS.DIRECTION;
            window.localStorage.removeItem(directionLocalStorageKey);
        };

        this.activateSorter = function (newSorter, newSequence) {
            if (sorter === newSorter) return;

            if (newSequence.length !== DEFAULTS.SEQUENCE.length) {
                throw 'Requested sorting sequence length does not match the number of images in the transect!';
            }

            sorter = newSorter;
            if (sorter === DEFAULTS.SORTER) {
                window.localStorage.removeItem(sorterLocalStorageKey);
            } else {
                window.localStorage.setItem(sorterLocalStorageKey, sorter);
            }

            sequence = newSequence;
            if (sequence === DEFAULTS.SEQUENCE) {
                window.localStorage.removeItem(sequenceLocalStorageKey);
            } else {
                window.localStorage.setItem(sequenceLocalStorageKey, JSON.stringify(sequence));
            }
        };

        this.getSequence = function () {
            if (direction === DESCENDING) {
                // don't alter the original sequence, use slice to copy the array
                return sequence.slice().reverse();
            }

            return sequence;
        };
    }
);
