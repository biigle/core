/**
 * @namespace dias.ui.utils
 * @ngdoc service
 * @name urlParams
 * @memberOf dias.ui.utils
 * @description Manages URL parameters
 */
angular.module('dias.ui.utils').service('urlParams', function ($location) {
        "use strict";

        var base = '';

        this.pushState = function (s) {
            $location.path(base + s);
        };

        // sets a URL parameter and updates the history state
        this.set = function (params) {
            var state = {};
            for (var key in params) {
                state[key] = params[key];
            }
            $location.search(state);
            $location.replace();
        };

        this.unset = function (key) {
            $location.search(key, null);
        };

        this.get = function (key) {
            return $location.search()[key];
        };

        this.setBase = function (b) {
            base = b;
        };
    }
);
