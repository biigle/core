/**
 * @namespace dias.transects.edit
 * @ngdoc controller
 * @name AnnotationSessionController
 * @memberOf dias.transects.edit
 * @description Controller for adding, editing and deleting annotation sessions
 */
angular.module('dias.transects.edit').controller('AnnotationSessionController', function ($scope, AnnotationSession, TRANSECT_ID, ANNOTATION_SESSIONS, msg) {
		"use strict";
        var editing = false;
        var loading = false;

        var errors = {};

        var now = new Date();

        var handleCreateSuccess = function (session) {
            ANNOTATION_SESSIONS.push(processSession(session));
            $scope.clearNewSession();
            loading = false;
        };

        var handleSaveSuccess = function () {
            for (var i = ANNOTATION_SESSIONS.length - 1; i >= 0; i--) {
                if (ANNOTATION_SESSIONS[i].id === $scope.newSession.id) {
                    ANNOTATION_SESSIONS[i] = $scope.newSession;
                    break;
                }
            }
            $scope.clearNewSession();
            loading = false;
        };

        var handleFormError = function (response) {
            errors = response.data;
            loading = false;
        };

        var handleDeleteSuccess = function () {
            for (var i = ANNOTATION_SESSIONS.length - 1; i >= 0; i--) {
                if (ANNOTATION_SESSIONS[i].id === $scope.newSession.id) {
                    ANNOTATION_SESSIONS.splice(i, 1);
                    break;
                }
            }
            $scope.clearNewSession();
            loading = false;
        };

        var handleError = function (response) {
            msr.responseError(response);
            loading = false;
        };

        var clearErrors = function () {
            errors = {};
        };

        var processSession = function (session) {
            session.starts_at = new Date(session.starts_at);
            session.starts_at_iso8601 = new Date(session.starts_at_iso8601);
            session.ends_at = new Date(session.ends_at);
            session.ends_at_iso8601 = new Date(session.ends_at_iso8601);

            return session;
        };

        var emptySession = {
            name: null,
            description: null,
            starts_at_iso8601: null,
            ends_at_iso8601: null,
            hide_other_users_annotations: false,
            hide_own_annotations: false
        };

        // alternative date input formats
        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy'];

        // open state of the date chooser popovers
        $scope.open = {
            starts_at: false,
            ends_at: false
        };

        $scope.newSession = angular.copy(emptySession);

        $scope.confirm = function () {
            return confirm.apply(window, arguments);
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
            if (!editing) {
                $scope.clearNewSession();
            }
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
            return session.starts_at_iso8601 < now && session.ends_at_iso8601 >= now;
        };

        $scope.dateComparator = function (session) {
            return session.starts_at_iso8601.getTime();
        };

        $scope.submit = function () {
            clearErrors();
            loading = true;

            // update regular timestamps
            $scope.newSession.starts_at = $scope.newSession.starts_at_iso8601;
            $scope.newSession.ends_at = $scope.newSession.ends_at_iso8601;

            if ($scope.newSession.id) {
                AnnotationSession.save($scope.newSession, handleSaveSuccess, handleFormError);
            } else {
                // Date objects are automatically parsed to ISO8601 strings with timezone
                // so the enpoint can handle the timezones correctly.
                AnnotationSession.create({transect_id: TRANSECT_ID}, $scope.newSession, handleCreateSuccess, handleFormError);
            }
        };

        $scope.deleteSession = function () {
            loading = true;
            AnnotationSession.delete({id: $scope.newSession.id}, handleDeleteSuccess, handleError);
        };

        $scope.clearNewSession = function () {
            clearErrors();
            $scope.newSession = angular.copy(emptySession);
        };

        $scope.editSession = function (session) {
            $scope.newSession = angular.copy(session);
        };

        // convert the relevant dates
        ANNOTATION_SESSIONS.forEach(processSession);
	}
);
