/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name ExportAreaSettingsController
 * @memberOf biigle.annotations
 * @description Controller for ATE example patches settings
 */
angular.module('biigle.annotations').controller('ExportAreaSettingsController', function ($scope, exportArea, settings) {
		"use strict";

        var key = 'export_area_opacity';

        settings.setDefaultSettings(key, '1');
        $scope[key] = settings.getPermanentSettings(key);

        $scope.edit = function () {
            if (!$scope.isShown()) {
                $scope[key] = '1';
            }

            exportArea.toggleEdit();
        };

        $scope.isEditing = exportArea.isEditing;

        $scope.isShown = function () {
            return $scope[key] !== '0';
        };

        $scope.delete = function () {
            if (exportArea.hasArea() && confirm('Do you really want to delete the export area?')) {
                exportArea.deleteArea();
            }
        };

        $scope.$on('image.shown', exportArea.updateHeight);
        $scope.$watch(key, function (opacity) {
            settings.setPermanentSettings(key, opacity);
            exportArea.setOpacity(opacity);
        });
	}
);
