/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SettingsMousePositionController
 * @memberOf dias.annotations
 * @description Controller for the mouse position settings
 */
angular.module('dias.annotations').controller('SettingsMousePositionController', function ($scope, settings) {
        "use strict";

        var key = 'show_mouse_position';

        settings.setDefaultSettings(key, false);

        $scope.shown = function () {
            return settings.getPermanentSettings(key);
        };

        $scope.show = function () {
            settings.setPermanentSettings(key, true);
        };

        $scope.hide = function () {
            settings.setPermanentSettings(key, false);
        };
    }
);
