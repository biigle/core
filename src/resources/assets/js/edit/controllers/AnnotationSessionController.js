/**
 * @namespace dias.transects.edit
 * @ngdoc controller
 * @name AnnotationSessionController
 * @memberOf dias.transects.edit
 * @description Controller for adding, editing and deleting annotation sessions
 */
angular.module('dias.transects.edit').controller('AnnotationSessionController', function ($scope, AnnotationSession, TRANSECT_ID, ANNOTATION_SESSIONS, msg) {
		"use strict";
        var editing = true;

        var errors = {};

        var dateFormat = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        };

        var now = new Date();

        var handleAddSuccess = function (session) {
            ANNOTATION_SESSIONS.push(session);
            for (var key in $scope.newSession) {
                if ($scope.newSession.hasOwnProperty(key)) {
                    $scope.newSession[key] = null;
                }
            }
        };

        var handleAddError = function (response) {
            errors = response.data;
        };

        var handleDeleteSuccess = function (session) {
            var index = ANNOTATION_SESSIONS.indexOf(session);
            if (index > -1) {
                ANNOTATION_SESSIONS.splice(index, 1);
            }
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

        $scope.confirm = function () {
            return confirm.apply(window, arguments);
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

        $scope.hasSessions = function () {
            return ANNOTATION_SESSIONS.length > 0;
        };

        $scope.getSessions = function () {
            return ANNOTATION_SESSIONS;
        };

        $scope.isActive = function (session) {
            return (new Date(session.starts_at_iso8601)) < now && (new Date(session.ends_at_iso8601)) >= now;
        };

        $scope.dateComparator = function (a, b) {
            return (new Date(a)) < (new Date(b)) ? -1 : 1;
        };

        $scope.addSession = function () {
            clearErrors();
            // Date objects are automatically parsed to ISO 8601 strings with timezone
            // so the enpoint can handle the timezones correctly.
            AnnotationSession.create({transect_id: TRANSECT_ID}, $scope.newSession, handleAddSuccess, handleAddError);
        };

        $scope.deleteSession = function (session) {
            AnnotationSession.delete({id: session.id}, function () {
                handleDeleteSuccess(session);
            }, msg.responseError);
        };
	}
);
