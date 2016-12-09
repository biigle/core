/**
 * @namespace dias.transects
 * @ngdoc service
 * @name filter
 * @memberOf dias.transects
 * @description Service managing the image filter of the transect index page
 */
angular.module('dias.transects').service('filter', function (TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filterExclude, $q) {
        "use strict";

        var DEFAULT_MODE = 'filter';
        var _this = this;

        var rulesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.filter.rules';
        var modeLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.filter.mode';

        // all available filters for which rules may be added
        var filters = [];

        var mode = window.localStorage.getItem(modeLocalStorageKey) || DEFAULT_MODE;
        var rules = JSON.parse(window.localStorage.getItem(rulesLocalStorageKey)) || [];

        // the image IDs that should be displayed
        var ids = [];

        var refresh = function () {
            angular.copy(TRANSECT_IMAGES, ids);
            var rule;

            for (var i = rules.length - 1; i >= 0; i--) {
                rule = rules[i];

                if (rule.negate) {
                    filterExclude(ids, rule.ids);
                } else {
                    filterSubset(ids, rule.ids);
                }
            }

            if (rules.length > 0) {
                window.localStorage.setItem(rulesLocalStorageKey, JSON.stringify(rules));
            } else {
                window.localStorage.removeItem(rulesLocalStorageKey);
            }

        };

        this.setMode = function (m) {
            mode = m;
            if (mode !== DEFAULT_MODE) {
                window.localStorage.setItem(modeLocalStorageKey, mode);
            } else {
                window.localStorage.removeItem(modeLocalStorageKey);
            }
        };

        this.getMode = function () {
            return mode;
        };

        this.add = function (newFilter) {
            if (!newFilter.hasOwnProperty('name')) {
                throw "A filter needs a name property";
            }

            if (!newFilter.hasOwnProperty('getSequence')) {
                throw "A filter needs a getSequence property";
            }

            filters.push({
                name: newFilter.name,
                helpText: newFilter.helpText || '',
                helpTextNegate: newFilter.helpTextNegate || '',
                getSequence: newFilter.getSequence,
                template: newFilter.template,
                typeahead: newFilter.typeahead,
            });

            if (newFilter.refreshSequence && newFilter.getSequence) {
                for (var i = rules.length - 1; i >= 0; i--) {
                    if (rules[i].filter.name === newFilter.name) {
                        rules[i].ids = newFilter.getSequence(rules[i].data);
                    }
                }
            }
        };

        this.getAll = function () {
            return filters;
        };

        this.addRule = function (r) {
            var rule = {
                filter: r.filter,
                negate: r.negate,
                data: r.data
            };

            var rollback = function () {
                _this.removeRule(rule);
            };

            // Use this ordering of lines so the promise can be resolved immediately
            // in the query function (e.g. if the ids are fetches from localStorage).
            rules.push(rule);
            rule.ids = r.filter.getSequence(r.data);
            rule.ids.$promise.then(refresh, rollback);

            return rule.ids.$promise;
        };

        this.getAllRules = function () {
            return rules;
        };

        this.removeRule = function (rule) {
            var index = rules.indexOf(rule);
            if (index >= 0) {
                rules.splice(index, 1);
            }

            refresh();
        };

        this.hasRule = function (r) {
            var rule;
            for (var i = rules.length - 1; i >= 0; i--) {
                rule = rules[i];
                if (rule.filter == r.filter && rule.negate == r.negate && rule.data == r.data) {
                    return true;
                }
            }

            return false;
        };

        this.hasRules = function () {
            return rules.length > 0;
        };

        this.rulesLoading = function () {
            for (var i = rules.length - 1; i >= 0; i--) {
                // may be undefined, too, if loaded from local storage
                // undefined means the ids are already loaded
                if (rules[i].ids.$resolved === false) {
                    return true;
                }
            }

            return false;
        };

        this.getNumberImages = function () {
            return ids.length;
        };

        this.getSequence = function () {
            if (mode === 'filter') {
                return ids;
            }

            return TRANSECT_IMAGES;
        };

        this.hasFlag = function (imageId) {
            if (mode === 'flag') {
                return ids.indexOf(imageId) >= 0;
            }

            return false;
        };

        this.reset = function () {
            rules.length = 0;
            _this.setMode(DEFAULT_MODE);
            refresh();
        };

        this.refresh = refresh;

        refresh();
    }
);
