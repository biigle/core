/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name settings
 * @memberOf dias.annotations
 * @description Service for the local settings of the annotation tool
 */
angular.module('dias.annotations').service('settings', function (debounce) {
        "use strict";

        var _this = this;

        var storageKey = 'dias.annotations.settings';

        var defaultSettings = {};

        // these settings will be remembered between sessions
        var permanentSettings = {};

        // these settings will be lost once the annotator was left
        var volatileSettings = {};

        var storeSettings = function () {
            var settings = angular.copy(permanentSettings);
            for (var key in settings) {
                if (settings[key] === defaultSettings[key]) {
                    // don't store default settings values
                    delete settings[key];
                }
            }

            window.localStorage.setItem(storageKey, JSON.stringify(settings));
        };

        var storeSettingsDebounced = function () {
            // wait for quick changes and only store them once things calmed down again
            // (e.g. when the user fools around with a range slider)
            debounce(storeSettings, 250, storageKey);
        };

        var restoreSettings = function () {
            var settings = {};
            if (window.localStorage.getItem(storageKey)) {
                settings = JSON.parse(window.localStorage.getItem(storageKey));
            }

            return angular.extend(settings, defaultSettings);
        };

        this.setPermanentSettings = function (key, value) {
            permanentSettings[key] = value;
            storeSettingsDebounced();
        };

        this.getPermanentSettings = function (key) {
            return permanentSettings[key];
        };

        this.setDefaultSettings = function (key, value) {
            defaultSettings[key] = value;
            if (!permanentSettings.hasOwnProperty(key)) {
                _this.setPermanentSettings(key, value);
            }
        };

        this.setVolatileSettings = function (key, value) {
            volatileSettings[key] = value;
        };

        this.getVolatileSettings = function (key) {
            return volatileSettings[key];
        };

        angular.extend(permanentSettings, restoreSettings());
    }
);
