/**
 * @namespace dias.transects.edit
 * @ngdoc controller
 * @name AnnotationSessionController
 * @memberOf dias.transects.edit
 * @description Controller for adding, editing and deleting annotation sessions
 */
angular.module('dias.transects.edit').controller('AnnotationSessionController', function ($scope, AnnotationSession, TRANSECT_ID, ANNOTATION_SESSIONS, msg, TransectUser) {
		"use strict";
        var editing = false;
        var loading = false;

        var transectUsers;

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
                    ANNOTATION_SESSIONS[i].users = $scope.sessionUsers;
                    break;
                }
            }
            $scope.clearNewSession();
            loading = false;
        };

        var handleUpdateError = function (response) {
            if (response.status === 400) {
                if (confirm(response.data.message + ' Use the Force and update the annotation session?')) {
                    $scope.submit(true);
                }

                loading = false;
            } else {
                errors = response.data;
                loading = false;
            }
        };

        var handleCreateError = function (response) {
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

        var handleDeleteError = function (response) {
            if (response.status === 400) {
                if (confirm(response.data.message + ' Use the Force and delete the annotation session?')) {
                    $scope.deleteSession(true);
                }

                loading = false;
            } else {
                msg.responseError(response);
                loading = false;
            }
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

        var hasSessionUser = function (user) {
            for (var i = $scope.sessionUsers.length - 1; i >= 0; i--) {
                if ($scope.sessionUsers[i].id === user.id) {
                    return true;
                }
            }

            return false;
        };

        var emptySession = {
            name: null,
            description: null,
            starts_at_iso8601: null,
            ends_at_iso8601: null,
            hide_other_users_annotations: false,
            hide_own_annotations: false,
            users: []
        };

        // alternative date input formats
        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy'];

        // open state of the date chooser popovers
        $scope.open = {
            starts_at: false,
            ends_at: false
        };

        $scope.newSession = angular.copy(emptySession);

        $scope.sessionUsers = [];

        $scope.selected = {
            // model for the new user typeahead
            user: ''
        };

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

            if (transectUsers === undefined) {
                transectUsers = TransectUser.query({transect_id: TRANSECT_ID});
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

        $scope.submit = function (force) {
            clearErrors();
            loading = true;

            // update regular timestamps
            $scope.newSession.starts_at = $scope.newSession.starts_at_iso8601;
            $scope.newSession.ends_at = $scope.newSession.ends_at_iso8601;

            $scope.newSession.users = $scope.sessionUsers.map(function (user) {
                return user.id;
            });

            if ($scope.newSession.id) {
                var params = {};

                if (force) {
                    params.force = 1;
                }

                AnnotationSession.save(params, $scope.newSession, handleSaveSuccess, handleUpdateError);
            } else {
                // Date objects are automatically parsed to ISO8601 strings with timezone
                // so the enpoint can handle the timezones correctly.
                AnnotationSession.create({transect_id: TRANSECT_ID}, $scope.newSession, handleCreateSuccess, handleCreateError);
            }
        };

        $scope.deleteSession = function (force) {
            loading = true;
            var params = {
                id: $scope.newSession.id
            };

            if (force) {
                params.force = 1;
            }

            AnnotationSession.delete(params, handleDeleteSuccess, handleDeleteError);
        };

        $scope.clearNewSession = function () {
            clearErrors();
            $scope.newSession = angular.copy(emptySession);
            $scope.sessionUsers = [];
            $scope.selected.user = '';
        };

        $scope.editSession = function (session) {
            $scope.newSession = angular.copy(session);
            $scope.sessionUsers = $scope.newSession.users;
        };

        $scope.getTransectUsers = function () {
            return transectUsers;
        };

        $scope.addUser = function (e, user) {
            e.preventDefault();

            if (!hasSessionUser(user)) {
                $scope.sessionUsers.push(user);
            }

            $scope.selected.user = '';
        };

        $scope.removeUser = function (user) {
            for (var i = $scope.sessionUsers.length - 1; i >= 0; i--) {
                if ($scope.sessionUsers[i].id === user.id) {
                    $scope.sessionUsers.splice(i, 1);
                }
            }
        };

        // convert the relevant dates
        ANNOTATION_SESSIONS.forEach(processSession);
	}
);
