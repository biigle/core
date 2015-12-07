/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', function (TRANSECT_ID, TRANSECT_IMAGES, filterSubset, flags) {
        "use strict";

        var _this = this;

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';

        var ordering = [];

        // the currently displayed ordering of images (as array of image IDs)
        this.sequence = [];
        // number of currently shown images
        this.limit = initialLimit;
        // number of overall images
        var length = TRANSECT_IMAGES.length;

        // check for a stored image sorting sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            _this.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(_this.sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, _this.sequence);
        }

        var updateSequence = function () {
            if (ordering.length === 0) {
                // reset, no filtering needed
                angular.copy(TRANSECT_IMAGES, _this.sequence);
            } else {
                angular.copy(ordering, _this.sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(_this.sequence, TRANSECT_IMAGES, true);
            }

            var filters = flags.getActiveFilters();

            for (var i = 0; i < filters.length; i++) {
                filterSubset(_this.sequence, filters[i]);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
        };

        this.progress = function () {
            return length > 0 ? Math.min(_this.limit / length, 1) : 0;
        };

        this.reorder = function (ids) {
            ordering = Array.isArray(ids) ? ids : [];
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
        };

        this.toggleFilter = function (id) {
            flags.toggleFilter(id);
            updateSequence();
        };

        this.advance = function (step) {
            _this.limit += step;
        };
    }
);
