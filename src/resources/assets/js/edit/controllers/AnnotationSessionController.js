/**
 * @namespace dias.transects.edit
 * @ngdoc controller
 * @name AnnotationSessionController
 * @memberOf dias.transects.edit
 * @description Controller for adding, editing and deleting annotation sessions
 */
angular.module('dias.transects.edit').controller('AnnotationSessionController', function ($scope, AnnotationSession, TRANSECT_ID) {
		"use strict";
        var editing = true;

        var errors = {};

        var handleAddSuccess = function (session) {
            console.log('success', session);
        };

        var handleAddError = function (response) {
            errors = response.data;
        };

        var clearErrors = function () {
            errors = {};
        };

        // alternative date input formats
        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy'];

        $scope.open = {
            starts_at: false,
            ends_at: false
        };

        $scope.newSession = {
            name: null,
            description: null,
            starts_at: null,
            ends_at: null,
            hide_other_users_annotations: false,
            hide_own_annotations: false
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.openStartsAt = function () {
            $scope.open.starts_at = true;
            $scope.open.ends_at = false;
        };

        $scope.openEndsAt = function () {
            $scope.open.ends_at = true;
            $scope.open.starts_at = false;
        };

        $scope.hasError = function (key) {
            return errors.hasOwnProperty(key);
        };

        $scope.getError = function (key) {
            if ($scope.hasError(key)) {
                return errors[key][0];
            }
        };

        $scope.addSession = function () {
            clearErrors();
            // Date objects are automatically parsed to ISO 8601 strings with timezone
            // so the enpoint can handle the timezones correctly.
            AnnotationSession.create({transect_id: TRANSECT_ID}, $scope.newSession, handleAddSuccess, handleAddError);
        };
	}
);
