/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', function ($rootScope, TRANSECT_ID, TRANSECT_IMAGES, filterSubset, flags) {
        "use strict";

        var _this = this;

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';
        var orderingLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.ordering';

        var ordering = [];

        // the currently displayed ordering of images (as array of image IDs)
        this.sequence = [];
        // number of currently shown images
        this.limit = initialLimit;

        // check for a stored image sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            _this.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(_this.sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, _this.sequence);
        }

        // check for a stored image ordering
        if (window.localStorage[orderingLocalStorageKey]) {
            ordering = JSON.parse(window.localStorage[orderingLocalStorageKey]);
        }

        // number of overall images
        this.length = this.sequence.length;

        var updateSequence = function () {
            var shouldStore = false;
            if (ordering.length === 0) {
                angular.copy(TRANSECT_IMAGES, _this.sequence);
            } else {
                shouldStore = true;
                angular.copy(ordering, _this.sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(_this.sequence, TRANSECT_IMAGES, true);
            }

            var filters = flags.getActiveFilters();

            for (var i = 0; i < filters.length; i++) {
                shouldStore = true;
                filterSubset(_this.sequence, filters[i]);
            }

            _this.length = _this.sequence.length;

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }
        };

        this.progress = function () {
            return _this.length > 0 ? Math.min(_this.limit / _this.length, 1) : 0;
        };

        this.reorder = function (ids) {
            ordering = Array.isArray(ids) ? ids : [];
            if (ordering.length > 0) {
                window.localStorage[orderingLocalStorageKey] = JSON.stringify(ordering);
            } else {
                // dont save the ordering if it equals the TRANSECT_IMAGES
                window.localStorage.removeItem(orderingLocalStorageKey);
            }

            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-ordering');
        };

        this.toggleFilter = function (id) {
            flags.toggleFilter(id);
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-filtering');
        };

        this.advance = function (step) {
            _this.limit += step;
        };
    }
);
