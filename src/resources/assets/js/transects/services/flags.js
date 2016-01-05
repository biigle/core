/**
 * @namespace dias.transects
 * @ngdoc service
 * @name flags
 * @memberOf dias.transects
 * @description Service managing the image flags of the transect index page
 */
angular.module('dias.transects').service('flags', function (TRANSECT_ID, TRANSECT_IMAGES) {
        "use strict";

        var activeFiltersLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.active_filters';
        var activeNegateFiltersLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.active_negate_filters';

        var _this = this;
        var flags = {};
        this.list = flags;

        // caches a map of all flags for all images of the transect
        this.cache = {};

        var activeFilters = [];

        // check for a stored active filters
        if (window.localStorage[activeFiltersLocalStorageKey]) {
            activeFilters = JSON.parse(window.localStorage[activeFiltersLocalStorageKey]);
        }

        var activeNegateFilters = [];

        // check for a stored active negate filters
        if (window.localStorage[activeNegateFiltersLocalStorageKey]) {
            activeNegateFilters = JSON.parse(window.localStorage[activeNegateFiltersLocalStorageKey]);
        }

        var getFlagsOfImage = function (id) {
            var output = [];
            for (var flagId in flags) {
                if (flags[flagId].ids.indexOf(id) !== -1) {
                    output.push(flags[flagId]);
                }
            }

            return output;
        };

        var renewCache = function () {
            for (var i = 0; i < TRANSECT_IMAGES.length; i++) {
                _this.cache[TRANSECT_IMAGES[i]] = getFlagsOfImage(TRANSECT_IMAGES[i]);
            }
        };

        var filterIsActive = function (id) {
            return activeFilters.indexOf(id) !== -1;
        };

        var negateFilterIsActive = function (id) {
            return activeNegateFilters.indexOf(id) !== -1;
        };

        var activateFilter = function (id) {
            flags[id].activeFilter = true;
            activeFilters.push(id);
            window.localStorage[activeFiltersLocalStorageKey] = JSON.stringify(activeFilters);
        };

        var deactivateFilter = function (id) {
            var index = activeFilters.indexOf(id);
            if (index === -1) return;
            flags[id].activeFilter = false;
            activeFilters.splice(index, 1);
            window.localStorage[activeFiltersLocalStorageKey] = JSON.stringify(activeFilters);
        };

        var activateNegateFilter = function (id) {
            flags[id].activeNegateFilter = true;
            activeNegateFilters.push(id);
            window.localStorage[activeNegateFiltersLocalStorageKey] = JSON.stringify(activeNegateFilters);
        };

        var deactivateNegateFilter = function (id) {
            var index = activeNegateFilters.indexOf(id);
            if (index === -1) return;
            flags[id].activeNegateFilter = false;
            activeNegateFilters.splice(index, 1);
            window.localStorage[activeNegateFiltersLocalStorageKey] = JSON.stringify(activeNegateFilters);
        };

        /**
         * id: Unique identifier of the flag. Will be added as class of the flag element for each element
         * ids: IDs of the images to be flagged
         * title: Content for the title property of the image flag element
         */
        this.add = function (id, ids, title) {
            flags[id] = {
                cssClass: id,
                ids: ids,
                title: title,
                activeFilter: filterIsActive(id),
                activeNegateFilter: negateFilterIsActive(id)
            };
            renewCache();
        };

        this.remove = function (id) {
            delete flags[id];
            renewCache();
        };

        this.toggleFilter = function (id) {
            if (!flags.hasOwnProperty(id)) return;

            if (filterIsActive(id)) {
                deactivateFilter(id);
            } else {
                activateFilter(id);
            }

            deactivateNegateFilter(id);
        };

        this.toggleNegateFilter = function (id) {
            if (!flags.hasOwnProperty(id)) return;

            if (negateFilterIsActive(id)) {
                deactivateNegateFilter(id);
            } else {
                activateNegateFilter(id);
            }
            deactivateFilter(id);
        };

        this.getActiveFilters = function () {
            var filters = [];
            for (var i = 0; i < activeFilters.length; i++) {
                filters.push(flags[activeFilters[i]].ids);
            }

            return filters;
        };

        this.hasActiveFilters = function () {
            return activeFilters.length > 0;
        };

        this.getActiveNegateFilters = function () {
            var filters = [];
            for (var i = 0; i < activeNegateFilters.length; i++) {
                filters.push(flags[activeNegateFilters[i]].ids);
            }

            return filters;
        };

        this.hasActiveNegateFilters = function () {
            return activeNegateFilters.length > 0;
        };
    }
);
