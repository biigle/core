/**
 * @namespace dias.label-trees
 * @ngdoc controller
 * @name MembersController
 * @memberOf dias.label-trees
 * @description Controller for the the amembers of a label tree
 */
angular.module('dias.label-trees').controller('MembersController', function ($scope, LABEL_TREE, MEMBERS, ROLES, USER_ID, LabelTreeUser, msg, User) {
        "use strict";

        var editing = false;
        var loading = false;

        $scope.newMember = {
            user: null,
            role_id: null
        };

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var roleUpdated = function (member) {
            member.role_id = parseInt(member.tmp_role_id);
            loading = false;
        };

        var roleUpdateFailed = function (member, response) {
            member.tmp_role_id = member.role_id.toString();
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
            member.tmp_role_id = member.role_id.toString();
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
            LabelTreeUser.update(
                {label_tree_id: LABEL_TREE.id},
                {id: member.id, role_id: parseInt(member.tmp_role_id)},
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
            LabelTreeUser.detach(
                {label_tree_id: LABEL_TREE.id},
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
                $scope.newMember.role_id !== null;
        };

        $scope.attachMember = function () {
            if (!$scope.newMemberValid()) return;

            loading = true;
            var member = $scope.newMember.user;
            // overwrite global role_id returned from User.find() with label tree role_id
            member.role_id = parseInt($scope.newMember.role_id);

            LabelTreeUser.attach(
                {label_tree_id: LABEL_TREE.id},
                {id: member.id, role_id: member.role_id},
                function () {
                    memberAttached(member);
                },
                handleError
            );
        };

        // convert role IDs to string so they can be selected in a select input field
        // also add it as tmp_role_id so the ID can be reset if the change failed
        for (var i = MEMBERS.length - 1; i >= 0; i--) {
            MEMBERS[i].tmp_role_id = MEMBERS[i].role_id.toString();
        }
    }
);
