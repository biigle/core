/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SettingsAnnotationOpacityController
 * @memberOf dias.annotations
 * @description Controller for the sidebar settings foldout
 */
angular.module('dias.annotations').controller('SettingsAnnotationOpacityController', function ($scope, mapAnnotations, settings) {
        "use strict";

        var key = 'annotation_opacity';

        settings.setDefaultSettings(key, '1');
        $scope[key] = settings.getPermanentSettings(key);

        $scope.$watch(key, function (opacity) {
            settings.setPermanentSettings(key, opacity);
            mapAnnotations.setOpacity(opacity);
        });
    }
);
