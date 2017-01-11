/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name SettingsExpertController
 * @memberOf biigle.annotations
 * @description Controller for expert settings
 */
angular.module('biigle.annotations').controller('SettingsExpertController', function ($scope, settings) {
        "use strict";

        var mouseKey = 'show_mouse_position';

        settings.setDefaultSettings(mouseKey, false);

        $scope.mouseShown = function () {
            return settings.getPermanentSettings(mouseKey);
        };

        $scope.showMouse = function () {
            settings.setPermanentSettings(mouseKey, true);
        };

        $scope.hideMouse = function () {
            settings.setPermanentSettings(mouseKey, false);
        };

        var modifyKey = 'disable_modify_interaction';

        settings.setDefaultSettings(modifyKey, false);

        $scope.modifyDisabled = function () {
            return settings.getPermanentSettings(modifyKey);
        };

        $scope.enableModify = function () {
            if ($scope.modifyDisabled()) {
                settings.setPermanentSettings(modifyKey, false);
                location.reload();
            }
        };

        $scope.disableModify = function () {
            if (!$scope.modifyDisabled()) {
                settings.setPermanentSettings(modifyKey, true);
                location.reload();
            }
        };
    }
);
