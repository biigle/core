/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.api', 'dias.ui.messages', 'dias.ui.users', 'ui.bootstrap']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', ["$scope", "$modal", "$attrs", "msg", function ($scope, $modal, $attrs, msg) {
		"use strict";

		var success = function () {
			$scope.redirectToDashboard($attrs.successMsg);
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
			$scope.redirectToDashboard($attrs.leavingSuccessMsg);
		};

		$scope.redirectToDashboard = function (message, type) {
			type = type || 'success';
			msg.post(type, message);
			$timeout(function () {
				window.location.href = $attrs.dashboardUrl;
			}, 2000);
		};

		$scope.project = Project.get({id: $attrs.projectId});

		$scope.ownUserId = $attrs.userId;

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
 * @name ProjectMembersContainerController
 * @memberOf dias.projects
 * @description Contains project members of a certain role. New members can be dropped in.
 */
angular.module('dias.projects').controller('ProjectMembersContainerController', ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
		"use strict";

		var dragover = function (e) {
			$scope.hovering = true;
			$scope.$apply();
			 e.preventDefault();
		};

		var dragleave = function (e) {
			$scope.hovering = false;
			$scope.$apply();
		};

		var drop = function (e) {
			$scope.hovering = false;
			$scope.changeUserRole(
				// user id
				e.dataTransfer.getData('text/plain'),
				// new role name
				$attrs.role
			);
			$scope.$apply();
			e.preventDefault();
		};

		// only allow dropping if editing
		$scope.$watch('editing', function (editing) {
			if (editing) {
				$element.on('dragover', dragover);
				$element.on('dragleave', dragleave);
				$element.on('drop', drop);
			} else {
				$element.off('dragover', dragover);
				$element.off('dragleave', dragleave);
				$element.off('drop', drop);
			}
		});
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

		$scope.addUser = function (user) {
			// new users are guests by default
			var roleId = $scope.roles.guest;

			var success = function () {
				user.project_role_id = roleId;
				$scope.users.push(user);
			};

			// user shouldn't already exist
			if (!getUser(user.id)) {
				ProjectUser.attach(
					{project_id: $scope.project.id},
					{id: user.id, project_role_id: roleId},
					success, msg.responseError
				);
			}
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

			var success = function () {
				var index;

				for (var i = $scope.users.length - 1; i >= 0; i--) {
					if ($scope.users[i].id == userId) {
						index = i;
						break;
					}
				}

				$scope.users.splice(index, 1);
			};

			ProjectUser.detach(
				{project_id: $scope.project.id},
				{id: userId},
				success, msg.responseError
			);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udGFpbmVyQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aS5tZXNzYWdlcycsICdkaWFzLnVpLnVzZXJzJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlZGlyZWN0VG9EYXNoYm9hcmQoJGF0dHJzLnN1Y2Nlc3NNc2cpO1xuXHRcdH07XG5cblx0XHR2YXIgZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtc2cuZGFuZ2VyKCRhdHRycy5lcnJvck1zZyk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtRGVsZXRlTW9kYWwuaHRtbCcsXG5cdFx0XHRcdHNpemU6ICdzbScsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJyxcblx0XHRcdFx0c2NvcGU6ICRzY29wZVxuXHRcdFx0fSk7XG5cblx0XHRcdG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRzd2l0Y2ggKHJlc3VsdCkge1xuXHRcdFx0XHRcdGNhc2UgJ3N1Y2Nlc3MnOlxuXHRcdFx0XHRcdFx0c3VjY2VzcygpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnZXJyb3InOlxuXHRcdFx0XHRcdFx0ZXJyb3IoKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgdGhlIGNvbmZpcm1hdGlvbiBvZiBkZWxldGlvbiBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2plY3QpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5mb3JjZSA9IGZhbHNlO1xuXG5cdFx0dmFyIGRlbGV0ZVN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0JHNjb3BlLiRjbG9zZSgnc3VjY2VzcycpO1xuXHRcdH07XG5cblx0XHR2YXIgZGVsZXRlRXJyb3IgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7XG5cdFx0XHRcdCRzY29wZS5mb3JjZSA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuJGNsb3NlKCdlcnJvcicpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9ICRzY29wZS5mb3JjZSA/IHtmb3JjZTogdHJ1ZX0gOiB7fTtcblx0XHRcdCRzY29wZS5wcm9qZWN0LiRkZWxldGUocGFyYW1zLCBkZWxldGVTdWNjZXNzLCBkZWxldGVFcnJvcik7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdEluZGV4Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBSb290IGNvbnRyb2xsZXIgb2YgdGhlIHByb2plY3QgaW5kZXggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5kZXhDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzLCBQcm9qZWN0LCAkbW9kYWwsIFByb2plY3RVc2VyLCBtc2csICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbGVhdmluZ1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCgkYXR0cnMubGVhdmluZ1N1Y2Nlc3NNc2cpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCA9IGZ1bmN0aW9uIChtZXNzYWdlLCB0eXBlKSB7XG5cdFx0XHR0eXBlID0gdHlwZSB8fCAnc3VjY2Vzcyc7XG5cdFx0XHRtc2cucG9zdCh0eXBlLCBtZXNzYWdlKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuZGFzaGJvYXJkVXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5wcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAkYXR0cnMucHJvamVjdElkfSk7XG5cblx0XHQkc2NvcGUub3duVXNlcklkID0gJGF0dHJzLnVzZXJJZDtcblxuXHRcdCRzY29wZS5sZWF2ZVByb2plY3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtTGVhdmVQcm9qZWN0TW9kYWwuaHRtbCcsXG5cdFx0XHRcdHNpemU6ICdzbSdcblx0XHRcdH0pO1xuXG5cdFx0XHRtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0aWYgKHJlc3VsdCA9PSAneWVzJykge1xuXHRcdFx0XHRcdFByb2plY3RVc2VyLmRldGFjaCh7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3QuaWR9LCB7aWQ6ICRzY29wZS5vd25Vc2VySWR9LCBsZWF2aW5nU3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSBpbmZvcm1hdGlvbiBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHRcblx0XHQkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RNZW1iZXJzQ29udGFpbmVyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250YWlucyBwcm9qZWN0IG1lbWJlcnMgb2YgYSBjZXJ0YWluIHJvbGUuIE5ldyBtZW1iZXJzIGNhbiBiZSBkcm9wcGVkIGluLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udGFpbmVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmFnb3ZlciA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSB0cnVlO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0IGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRyYWdsZWF2ZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRyb3AgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0JHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUoXG5cdFx0XHRcdC8vIHVzZXIgaWRcblx0XHRcdFx0ZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpLFxuXHRcdFx0XHQvLyBuZXcgcm9sZSBuYW1lXG5cdFx0XHRcdCRhdHRycy5yb2xlXG5cdFx0XHQpO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH07XG5cblx0XHQvLyBvbmx5IGFsbG93IGRyb3BwaW5nIGlmIGVkaXRpbmdcblx0XHQkc2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdGlmIChlZGl0aW5nKSB7XG5cdFx0XHRcdCRlbGVtZW50Lm9uKCdkcmFnb3ZlcicsIGRyYWdvdmVyKTtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdCRlbGVtZW50Lm9uKCdkcm9wJywgZHJvcCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkZWxlbWVudC5vZmYoJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHQkZWxlbWVudC5vZmYoJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJvcCcsIGRyb3ApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0TWVtYmVyc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIG1lbWJlcnMgb2YgYSBwcm9qZWN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJvbGUsIFByb2plY3RVc2VyLCBtc2csICRtb2RhbCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGdldFVzZXIgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGZvciAodmFyIGkgPSAkc2NvcGUudXNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKCRzY29wZS51c2Vyc1tpXS5pZCA9PSBpZCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUudXNlcnNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIGNvbmZpcm1DaGFuZ2VPd25Sb2xlID0gZnVuY3Rpb24gKHVzZXJJZCwgcm9sZSkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkbW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybUNoYW5nZVJvbGVNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAocmVzdWx0ID09ICd5ZXMnKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNoYW5nZVVzZXJSb2xlKHVzZXJJZCwgcm9sZSwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyb2xlc0FycmF5KSB7XG5cdFx0XHQkc2NvcGUucm9sZXMgPSB7fTtcblx0XHRcdGZvciAodmFyIGkgPSByb2xlc0FycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdCRzY29wZS5yb2xlc1tyb2xlc0FycmF5W2ldLm5hbWVdID0gcm9sZXNBcnJheVtpXS5pZDtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS5wcm9qZWN0LiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZCB9KTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5hZGRVc2VyID0gZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0XHRcdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXMuZ3Vlc3Q7XG5cblx0XHRcdHZhciBzdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHRcdFx0JHNjb3BlLnVzZXJzLnB1c2godXNlcik7XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdFx0XHRpZiAoIWdldFVzZXIodXNlci5pZCkpIHtcblx0XHRcdFx0UHJvamVjdFVzZXIuYXR0YWNoKFxuXHRcdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sXG5cdFx0XHRcdFx0e2lkOiB1c2VyLmlkLCBwcm9qZWN0X3JvbGVfaWQ6IHJvbGVJZH0sXG5cdFx0XHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNoYW5nZVVzZXJSb2xlID0gZnVuY3Rpb24gKHVzZXJJZCwgcm9sZSwgZm9yY2UpIHtcblx0XHRcdGlmICghZm9yY2UgJiYgdXNlcklkID09ICRzY29wZS5vd25Vc2VySWQpIHtcblx0XHRcdFx0Y29uZmlybUNoYW5nZU93blJvbGUodXNlcklkLCByb2xlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdXNlciA9IGdldFVzZXIodXNlcklkKTtcblx0XHRcdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXNbcm9sZV07XG5cblx0XHRcdC8vIG5vIGFjdGlvbiByZXF1aXJlZFxuXHRcdFx0aWYgKHVzZXIucHJvamVjdF9yb2xlX2lkID09IHJvbGVJZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHRcdH07XG5cblx0XHRcdFByb2plY3RVc2VyLnNhdmUoXG5cdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sXG5cdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVVzZXIgPSBmdW5jdGlvbiAodXNlcklkKSB7XG5cdFx0XHQvLyBsZWF2aW5nIHRoZSBwcm9qZWN0IHdpbGwgYmUgaGFuZGxlZCBieSBwYXJlbnQgY29udHJvbGxlclxuXHRcdFx0aWYgKHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdCRzY29wZS5sZWF2ZVByb2plY3QoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGluZGV4O1xuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAkc2NvcGUudXNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IHVzZXJJZCkge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5kZXRhY2goXG5cdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sXG5cdFx0XHRcdHtpZDogdXNlcklkfSxcblx0XHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHRcdCk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgcHJvamVjdCBtZW1iZXIgZWxlbWVudCBpbiB0aGUgcHJvamVjdCBtZW1iZXJzIG92ZXJ2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHZhciBkcmFnc3RhcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGUuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gIFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gZGlzYWJsZSBkcmFnZ2luZyB3aGVuIHJlbW92aW5nIGlzIGluIHByb2dyZXNzXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgncmVtb3ZpbmcnLCBmdW5jdGlvbiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRpZiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub2ZmKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9uKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gd2hlbiBlZGl0aW5nIGlzIHN3aXRjaGVkIG9mZiwgcmVtb3ZpbmcgaXMgY2FuY2VsZWQsIHRvb1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHRcdFx0c2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmVVc2VyKCRzY29wZS51c2VyLmlkKTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9