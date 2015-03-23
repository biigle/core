/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.api', 'dias.ui.messages', 'ui.bootstrap']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', ["$scope", "$modal", "$attrs", "$timeout", "msg", function ($scope, $modal, $attrs, $timeout, msg) {
		"use strict";

		var success = function () {
			msg.success($attrs.successMsg);
			$timeout(function () {
				window.location.href = $scope.dashboardUrl;
			}, 2000);
		};

		var error = function () {
			msg.danger($attrs.errorMsg);
		};

		$scope.submit = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteModal.html',
				size: 'sm',
				controller: 'ProjectDeleteModalController',
				scope: $scope
			});

			modalInstance.result.then(function (result) {
				switch (result) {
					case 'success':
						success();
						break;
					case 'error':
						error();
						break;
				}
			});
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteModalController
 * @memberOf dias.projects
 * @description Handles the confirmation of deletion of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteModalController', ["$scope", "Project", function ($scope, Project) {
		"use strict";

		$scope.force = false;

		var deleteSuccess = function (response, status) {
			$scope.$close('success');
		};

		var deleteError = function(response) {
			if (response.status === 400) {
				$scope.force = true;
			} else {
				$scope.$close('error');
			}
		};

		$scope.delete = function () {
			var params = $scope.force ? {force: true} : {};
			$scope.project.$delete(params, deleteSuccess, deleteError);
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectIndexController
 * @memberOf dias.projects
 * @description Root controller of the project index page.
 */
angular.module('dias.projects').controller('ProjectIndexController', ["$scope", "$attrs", "Project", "$modal", "ProjectUser", "msg", "$timeout", function ($scope, $attrs, Project, $modal, ProjectUser, msg, $timeout) {
		"use strict";

		var leavingSuccess = function () {
			msg.success($attrs.leavingSuccessMsg);
			$timeout(function () {
				window.location.href = $scope.dashboardUrl;
			}, 2000);
		};

		$scope.project = Project.get({id: $attrs.projectId});

		$scope.ownUserId = $attrs.userId;

		$scope.dashboardUrl = $attrs.dashboardUrl;

		$scope.leaveProject = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmLeaveProjectModal.html',
				size: 'sm'
			});

			modalInstance.result.then(function (result) {
				if (result == 'yes') {
					ProjectUser.detach({project_id: $scope.project.id}, {id: $scope.ownUserId}, leavingSuccess, msg.responseError);
				}
			});
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectInformationController
 * @memberOf dias.projects
 * @description Handles modification of the information of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectInformationController', ["$scope", function ($scope) {
		"use strict";
		
		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectMembersController
 * @memberOf dias.projects
 * @description Handles modification of the members of a project.
 */
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", "msg", "$modal", function ($scope, Role, ProjectUser, msg, $modal) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
		};

		var confirmChangeOwnRole = function (userId, role) {
			var modalInstance = $modal.open({
				templateUrl: 'confirmChangeRoleModal.html',
				size: 'sm'
			});

			modalInstance.result.then(function (result) {
				if (result == 'yes') {
					$scope.changeUserRole(userId, role, true);
				}
			});
		};

		Role.query(function (rolesArray) {
			$scope.roles = {};
			for (var i = rolesArray.length - 1; i >= 0; i--) {
				$scope.roles[rolesArray[i].name] = rolesArray[i].id;
			}
		});

		$scope.project.$promise.then(function () {
			$scope.users = ProjectUser.query({ project_id: $scope.project.id });
		});

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.changeUserRole = function (userId, role, force) {
			if (!force && userId == $scope.ownUserId) {
				confirmChangeOwnRole(userId, role);
				return;
			}

			var user = getUser(userId);
			var roleId = $scope.roles[role];

			// no action required
			if (user.project_role_id == roleId) {
				return;
			}

			var success = function () {
				user.project_role_id = roleId;
			};

			ProjectUser.save(
				{project_id: $scope.project.id},
				{id: user.id, project_role_id: roleId},
				success, msg.responseError
			);
		};

		$scope.removeUser = function (userId) {
			// leaving the project will be handled by parent controller
			if (userId == $scope.ownUserId) {
				$scope.leaveProject();
				return;
			}

			var index;
			var user;

			var success = function () {
				$scope.users.splice(index, 1);
			};

			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == userId) {
					user = $scope.users[i];
					index = i;
				}
			}

			user.$detach({project_id: $scope.project.id}, success, msg.responseError);
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectMember
 * @memberOf dias.projects
 * @description A project member element in the project members overview.
 */
angular.module('dias.projects').directive('projectMember', function () {
		"use strict";

		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				var dragstart = function (e) {
					e.dataTransfer.effectAllowed = 'move';
  					e.dataTransfer.setData('text/plain', scope.user.id);
				};

				// disable dragging when removing is in progress
				scope.$watch('removing', function (removing) {
					if (removing) {
						element.off('dragstart', dragstart);
					} else {
						element.on('dragstart', dragstart);
					}
				});

				// when editing is switched off, removing is canceled, too
				scope.$watch('editing', function (editing) {
					if (!editing) {
						scope.cancelRemove();
					}
				});
			},
			controller: ["$scope", function ($scope) {
				$scope.startRemove = function () {
					$scope.removing = true;
				};

				$scope.cancelRemove = function () {
					$scope.removing = false;
				};

				$scope.remove = function () {
					$scope.removeUser($scope.user.id);
				};
			}]
		};
	}
);

/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectMemberContainer
 * @memberOf dias.projects
 * @description Contains project members of a certain role. New members can be dropped in.
 */
angular.module('dias.projects').directive('projectMemberContainer', function () {
		"use strict";

		return {
			restrict: 'A',
			// each container has its own scope
			scope: true,
			link: function (scope, element, attrs) {
				var dragover = function (e) {
					scope.hovering = true;
					scope.$apply();
					 e.preventDefault();
				};

				var dragleave = function (e) {
					scope.hovering = false;
					scope.$apply();
				};

				var drop = function (e) {
					scope.hovering = false;
					scope.changeUserRole(
						// user id
						e.dataTransfer.getData('text/plain'),
						// new role name
						attrs.role
					);
					scope.$apply();
					e.preventDefault();
				};

				// only allow dropping if editing
				scope.$watch('editing', function (editing) {
					if (editing) {
						element.on('dragover', dragover);
						element.on('dragleave', dragleave);
						element.on('drop', drop);
					} else {
						element.off('dragover', dragover);
						element.off('dragleave', dragleave);
						element.off('drop', drop);
					}
				});
			}
		};
	}
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlckNvbnRhaW5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBwcm9qZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpLm1lc3NhZ2VzJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCAkdGltZW91dCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5zdWNjZXNzKCRhdHRycy5zdWNjZXNzTXNnKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkc2NvcGUuZGFzaGJvYXJkVXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5kYW5nZXIoJGF0dHJzLmVycm9yTXNnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLFxuXHRcdFx0XHRzY29wZTogJHNjb3BlXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdHN3aXRjaCAocmVzdWx0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnc3VjY2Vzcyc6XG5cdFx0XHRcdFx0XHRzdWNjZXNzKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdlcnJvcic6XG5cdFx0XHRcdFx0XHRlcnJvcigpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgY29uZmlybWF0aW9uIG9mIGRlbGV0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvamVjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmZvcmNlID0gZmFsc2U7XG5cblx0XHR2YXIgZGVsZXRlU3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHQkc2NvcGUuJGNsb3NlKCdzdWNjZXNzJyk7XG5cdFx0fTtcblxuXHRcdHZhciBkZWxldGVFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0JHNjb3BlLmZvcmNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS4kY2xvc2UoJ2Vycm9yJyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJHNjb3BlLmZvcmNlID8ge2ZvcmNlOiB0cnVlfSA6IHt9O1xuXHRcdFx0JHNjb3BlLnByb2plY3QuJGRlbGV0ZShwYXJhbXMsIGRlbGV0ZVN1Y2Nlc3MsIGRlbGV0ZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5kZXhDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIFJvb3QgY29udHJvbGxlciBvZiB0aGUgcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIFByb2plY3QsICRtb2RhbCwgUHJvamVjdFVzZXIsIG1zZywgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBsZWF2aW5nU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5zdWNjZXNzKCRhdHRycy5sZWF2aW5nU3VjY2Vzc01zZyk7XG5cdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJHNjb3BlLmRhc2hib2FyZFVybDtcblx0XHRcdH0sIDIwMDApO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogJGF0dHJzLnByb2plY3RJZH0pO1xuXG5cdFx0JHNjb3BlLm93blVzZXJJZCA9ICRhdHRycy51c2VySWQ7XG5cblx0XHQkc2NvcGUuZGFzaGJvYXJkVXJsID0gJGF0dHJzLmRhc2hib2FyZFVybDtcblxuXHRcdCRzY29wZS5sZWF2ZVByb2plY3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtTGVhdmVQcm9qZWN0TW9kYWwuaHRtbCcsXG5cdFx0XHRcdHNpemU6ICdzbSdcblx0XHRcdH0pO1xuXG5cdFx0XHRtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0aWYgKHJlc3VsdCA9PSAneWVzJykge1xuXHRcdFx0XHRcdFByb2plY3RVc2VyLmRldGFjaCh7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3QuaWR9LCB7aWQ6ICRzY29wZS5vd25Vc2VySWR9LCBsZWF2aW5nU3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSBpbmZvcm1hdGlvbiBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHRcblx0XHQkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgbWVtYmVycyBvZiBhIHByb2plY3QuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdE1lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUm9sZSwgUHJvamVjdFVzZXIsIG1zZywgJG1vZGFsKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZ2V0VXNlciA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgY29uZmlybUNoYW5nZU93blJvbGUgPSBmdW5jdGlvbiAodXNlcklkLCByb2xlKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtQ2hhbmdlUm9sZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChyZXN1bHQgPT0gJ3llcycpIHtcblx0XHRcdFx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUodXNlcklkLCByb2xlLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHJvbGVzQXJyYXkpIHtcblx0XHRcdCRzY29wZS5yb2xlcyA9IHt9O1xuXHRcdFx0Zm9yICh2YXIgaSA9IHJvbGVzQXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0JHNjb3BlLnJvbGVzW3JvbGVzQXJyYXlbaV0ubmFtZV0gPSByb2xlc0FycmF5W2ldLmlkO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnByb2plY3QuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUudXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkIH0pO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNoYW5nZVVzZXJSb2xlID0gZnVuY3Rpb24gKHVzZXJJZCwgcm9sZSwgZm9yY2UpIHtcblx0XHRcdGlmICghZm9yY2UgJiYgdXNlcklkID09ICRzY29wZS5vd25Vc2VySWQpIHtcblx0XHRcdFx0Y29uZmlybUNoYW5nZU93blJvbGUodXNlcklkLCByb2xlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdXNlciA9IGdldFVzZXIodXNlcklkKTtcblx0XHRcdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXNbcm9sZV07XG5cblx0XHRcdC8vIG5vIGFjdGlvbiByZXF1aXJlZFxuXHRcdFx0aWYgKHVzZXIucHJvamVjdF9yb2xlX2lkID09IHJvbGVJZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHRcdH07XG5cblx0XHRcdFByb2plY3RVc2VyLnNhdmUoXG5cdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sXG5cdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVVzZXIgPSBmdW5jdGlvbiAodXNlcklkKSB7XG5cdFx0XHQvLyBsZWF2aW5nIHRoZSBwcm9qZWN0IHdpbGwgYmUgaGFuZGxlZCBieSBwYXJlbnQgY29udHJvbGxlclxuXHRcdFx0aWYgKHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdCRzY29wZS5sZWF2ZVByb2plY3QoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaW5kZXg7XG5cdFx0XHR2YXIgdXNlcjtcblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdCRzY29wZS51c2Vycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fTtcblxuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IHVzZXJJZCkge1xuXHRcdFx0XHRcdHVzZXIgPSAkc2NvcGUudXNlcnNbaV07XG5cdFx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHVzZXIuJGRldGFjaCh7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3QuaWR9LCBzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgcHJvamVjdCBtZW1iZXIgZWxlbWVudCBpbiB0aGUgcHJvamVjdCBtZW1iZXJzIG92ZXJ2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHR2YXIgZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xuICBcdFx0XHRcdFx0ZS5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIHNjb3BlLnVzZXIuaWQpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIGRpc2FibGUgZHJhZ2dpbmcgd2hlbiByZW1vdmluZyBpcyBpbiBwcm9ncmVzc1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ3JlbW92aW5nJywgZnVuY3Rpb24gKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0aWYgKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8vIHdoZW4gZWRpdGluZyBpcyBzd2l0Y2hlZCBvZmYsIHJlbW92aW5nIGlzIGNhbmNlbGVkLCB0b29cblx0XHRcdFx0c2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0XHRcdHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHQkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92ZVVzZXIoJHNjb3BlLnVzZXIuaWQpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgcHJvamVjdE1lbWJlckNvbnRhaW5lclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250YWlucyBwcm9qZWN0IG1lbWJlcnMgb2YgYSBjZXJ0YWluIHJvbGUuIE5ldyBtZW1iZXJzIGNhbiBiZSBkcm9wcGVkIGluLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlckNvbnRhaW5lcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0Ly8gZWFjaCBjb250YWluZXIgaGFzIGl0cyBvd24gc2NvcGVcblx0XHRcdHNjb3BlOiB0cnVlLFxuXHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHR2YXIgZHJhZ292ZXIgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0XHQgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBkcmFnbGVhdmUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGRyb3AgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0c2NvcGUuY2hhbmdlVXNlclJvbGUoXG5cdFx0XHRcdFx0XHQvLyB1c2VyIGlkXG5cdFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJyksXG5cdFx0XHRcdFx0XHQvLyBuZXcgcm9sZSBuYW1lXG5cdFx0XHRcdFx0XHRhdHRycy5yb2xlXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gb25seSBhbGxvdyBkcm9wcGluZyBpZiBlZGl0aW5nXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgnZWRpdGluZycsIGZ1bmN0aW9uIChlZGl0aW5nKSB7XG5cdFx0XHRcdFx0aWYgKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub24oJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQub24oJ2Ryb3AnLCBkcm9wKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vZmYoJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vZmYoJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJvcCcsIGRyb3ApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==