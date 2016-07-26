/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ExportAreaSettingsController
 * @memberOf dias.annotations
 * @description Controller for ATE example patches settings
 */
angular.module('dias.annotations').controller('ExportAreaSettingsController', function ($scope, exportArea) {
		"use strict";

        $scope.setDefaultSettings('export_area_opacity', '1');

        $scope.edit = function () {
            if (!$scope.isShown()) {
                $scope.settings.export_area_opacity = '1';
            }

            exportArea.toggleEdit();
        };

        $scope.isEditing = exportArea.isEditing;

        $scope.isShown = function () {
            return $scope.settings.export_area_opacity !== '0';
        };

        $scope.delete = function () {
            if (exportArea.hasArea() && confirm('Do you really want to delete the export area?')) {
                exportArea.deleteArea();
            }
        };

        $scope.$on('image.shown', exportArea.updateHeight);

        $scope.$watch('settings.export_area_opacity', exportArea.setOpacity);
	}
);
