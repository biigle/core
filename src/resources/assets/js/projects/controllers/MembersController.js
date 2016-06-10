/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name MembersController
 * @memberOf dias.projects
 * @description Controller for the the members of a project
 */
angular.module('dias.projects').controller('MembersController', function ($scope, PROJECT, MEMBERS, ROLES, DEFAULT_ROLE_ID, USER_ID, ProjectUser, msg, User) {
        "use strict";

        var editing = false;
        var loading = false;

        $scope.newMember = {
            user: null,
            project_role_id: DEFAULT_ROLE_ID.toString()
        };

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var roleUpdated = function (member) {
            member.project_role_id = parseInt(member.tmp_project_role_id);
            loading = false;
        };

        var roleUpdateFailed = function (member, response) {
            member.tmp_project_role_id = member.project_role_id.toString();
            handleError(response);
        };

        var memberRemoved = function (member) {
            for (var i = MEMBERS.length - 1; i >= 0; i--) {
                if (MEMBERS[i].id === member.id) {
                    MEMBERS.splice(i, 1);
                    break;
                }
            }
            loading = false;
        };

        var userIsNoMember = function (user) {
            for (var i = MEMBERS.length - 1; i >= 0; i--) {
                if (MEMBERS[i].id === user.id) {
                    return false;
                }
            }

            return true;
        };

        var filterMembersFromUsers = function (users) {
            return users.filter(userIsNoMember);
        };

        var memberAttached = function (member) {
            member.tmp_project_role_id = member.project_role_id.toString();
            MEMBERS.push(member);
            $scope.newMember.user = null;
            loading = false;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.getMembers = function () {
            return MEMBERS;
        };

        $scope.hasMembers = function () {
            return MEMBERS.length > 0;
        };

        $scope.getRoles = function () {
            return ROLES;
        };

        $scope.getRole = function (id) {
            return ROLES[id];
        };

        $scope.isOwnUser = function (member) {
            return USER_ID === member.id;
        };

        $scope.updateRole = function (member) {
            loading = true;
            ProjectUser.save(
                {project_id: PROJECT.id},
                {id: member.id, project_role_id: parseInt(member.tmp_project_role_id)},
                function () {
                    roleUpdated(member);
                },
                function (response) {
                    roleUpdateFailed(member, response);
                }
            );
        };

        $scope.detachMember = function (member) {
            loading = true;
            ProjectUser.detach(
                {project_id: PROJECT.id},
                {id: member.id},
                function () {
                    memberRemoved(member);
                },
                handleError
            );
        };

        $scope.username = function (user) {
            if (user && user.firstname && user.lastname) {
                return user.firstname + ' ' + user.lastname;
            }

            return '';
        };

        $scope.findUser = function (query) {
            return User.find({query: encodeURIComponent(query)}).$promise
                .then(filterMembersFromUsers);
        };

        $scope.newMemberValid = function () {
            return $scope.newMember.user &&
                $scope.newMember.user.id !== undefined &&
                userIsNoMember($scope.newMember.user) &&
                $scope.newMember.project_role_id !== null;
        };

        $scope.attachMember = function () {
            if (!$scope.newMemberValid()) return;

            loading = true;
            var member = $scope.newMember.user;
            // overwrite global project_role_id returned from User.find() with label tree project_role_id
            member.project_role_id = parseInt($scope.newMember.project_role_id);

            ProjectUser.attach(
                {project_id: PROJECT.id},
                {id: member.id, project_role_id: member.project_role_id},
                function () {
                    memberAttached(member);
                },
                handleError
            );
        };

        // convert role IDs to string so they can be selected in a select input field
        // also add it as tmp_project_role_id so the ID can be reset if the change failed
        for (var i = MEMBERS.length - 1; i >= 0; i--) {
            MEMBERS[i].tmp_project_role_id = MEMBERS[i].project_role_id.toString();
        }
    }
);
