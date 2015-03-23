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
				window.location.href = $attrs.successRedirectUrl;
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
 * @example

 */
angular.module('dias.projects').controller('ProjectIndexController', ["$scope", "$attrs", "Project", function ($scope, $attrs, Project) {
		"use strict";

		$scope.project = Project.get({id: $attrs.projectId});
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
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", "msg", function ($scope, Role, ProjectUser, msg) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
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

		$scope.changeUserRole = function (userId, role) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlckNvbnRhaW5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBwcm9qZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpLm1lc3NhZ2VzJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCAkdGltZW91dCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5zdWNjZXNzKCRhdHRycy5zdWNjZXNzTXNnKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuc3VjY2Vzc1JlZGlyZWN0VXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5kYW5nZXIoJGF0dHJzLmVycm9yTXNnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLFxuXHRcdFx0XHRzY29wZTogJHNjb3BlXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdHN3aXRjaCAocmVzdWx0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnc3VjY2Vzcyc6XG5cdFx0XHRcdFx0XHRzdWNjZXNzKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdlcnJvcic6XG5cdFx0XHRcdFx0XHRlcnJvcigpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgY29uZmlybWF0aW9uIG9mIGRlbGV0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvamVjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmZvcmNlID0gZmFsc2U7XG5cblx0XHR2YXIgZGVsZXRlU3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHQkc2NvcGUuJGNsb3NlKCdzdWNjZXNzJyk7XG5cdFx0fTtcblxuXHRcdHZhciBkZWxldGVFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0JHNjb3BlLmZvcmNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS4kY2xvc2UoJ2Vycm9yJyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJHNjb3BlLmZvcmNlID8ge2ZvcmNlOiB0cnVlfSA6IHt9O1xuXHRcdFx0JHNjb3BlLnByb2plY3QuJGRlbGV0ZShwYXJhbXMsIGRlbGV0ZVN1Y2Nlc3MsIGRlbGV0ZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5kZXhDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIFJvb3QgY29udHJvbGxlciBvZiB0aGUgcHJvamVjdCBpbmRleCBwYWdlLlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIFByb2plY3QpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5wcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAkYXR0cnMucHJvamVjdElkfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGluZm9ybWF0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdFxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdE1lbWJlcnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSBtZW1iZXJzIG9mIGEgcHJvamVjdC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0TWVtYmVyc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBSb2xlLCBQcm9qZWN0VXNlciwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZ2V0VXNlciA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyb2xlc0FycmF5KSB7XG5cdFx0XHQkc2NvcGUucm9sZXMgPSB7fTtcblx0XHRcdGZvciAodmFyIGkgPSByb2xlc0FycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdCRzY29wZS5yb2xlc1tyb2xlc0FycmF5W2ldLm5hbWVdID0gcm9sZXNBcnJheVtpXS5pZDtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS5wcm9qZWN0LiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZCB9KTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jaGFuZ2VVc2VyUm9sZSA9IGZ1bmN0aW9uICh1c2VySWQsIHJvbGUpIHtcblx0XHRcdHZhciB1c2VyID0gZ2V0VXNlcih1c2VySWQpO1xuXHRcdFx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlc1tyb2xlXTtcblxuXHRcdFx0Ly8gbm8gYWN0aW9uIHJlcXVpcmVkXG5cdFx0XHRpZiAodXNlci5wcm9qZWN0X3JvbGVfaWQgPT0gcm9sZUlkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHVzZXIucHJvamVjdF9yb2xlX2lkID0gcm9sZUlkO1xuXHRcdFx0fTtcblxuXHRcdFx0UHJvamVjdFVzZXIuc2F2ZShcblx0XHRcdFx0e3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkfSxcblx0XHRcdFx0e2lkOiB1c2VyLmlkLCBwcm9qZWN0X3JvbGVfaWQ6IHJvbGVJZH0sXG5cdFx0XHRcdHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yXG5cdFx0XHQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlVXNlciA9IGZ1bmN0aW9uICh1c2VySWQpIHtcblx0XHRcdHZhciBpbmRleDtcblx0XHRcdHZhciB1c2VyO1xuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0JHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRmb3IgKHZhciBpID0gJHNjb3BlLnVzZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmICgkc2NvcGUudXNlcnNbaV0uaWQgPT0gdXNlcklkKSB7XG5cdFx0XHRcdFx0dXNlciA9ICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0XHRpbmRleCA9IGk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dXNlci4kZGV0YWNoKHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sIHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHByb2plY3RNZW1iZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBwcm9qZWN0IG1lbWJlciBlbGVtZW50IGluIHRoZSBwcm9qZWN0IG1lbWJlcnMgb3ZlcnZpZXcuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuZGlyZWN0aXZlKCdwcm9qZWN0TWVtYmVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHZhciBkcmFnc3RhcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGUuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gIFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gZGlzYWJsZSBkcmFnZ2luZyB3aGVuIHJlbW92aW5nIGlzIGluIHByb2dyZXNzXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgncmVtb3ZpbmcnLCBmdW5jdGlvbiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRpZiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub2ZmKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9uKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gd2hlbiBlZGl0aW5nIGlzIHN3aXRjaGVkIG9mZiwgcmVtb3ZpbmcgaXMgY2FuY2VsZWQsIHRvb1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHRcdFx0c2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSB0cnVlO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZlVXNlcigkc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyQ29udGFpbmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRhaW5zIHByb2plY3QgbWVtYmVycyBvZiBhIGNlcnRhaW4gcm9sZS4gTmV3IG1lbWJlcnMgY2FuIGJlIGRyb3BwZWQgaW4uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuZGlyZWN0aXZlKCdwcm9qZWN0TWVtYmVyQ29udGFpbmVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0XHQvLyBlYWNoIGNvbnRhaW5lciBoYXMgaXRzIG93biBzY29wZVxuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHZhciBkcmFnb3ZlciA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0c2NvcGUuaG92ZXJpbmcgPSB0cnVlO1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHRcdCBlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGRyYWdsZWF2ZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0c2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgZHJvcCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0c2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdFx0XHRzY29wZS5jaGFuZ2VVc2VyUm9sZShcblx0XHRcdFx0XHRcdC8vIHVzZXIgaWRcblx0XHRcdFx0XHRcdGUuZGF0YVRyYW5zZmVyLmdldERhdGEoJ3RleHQvcGxhaW4nKSxcblx0XHRcdFx0XHRcdC8vIG5ldyByb2xlIG5hbWVcblx0XHRcdFx0XHRcdGF0dHJzLnJvbGVcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvLyBvbmx5IGFsbG93IGRyb3BwaW5nIGlmIGVkaXRpbmdcblx0XHRcdFx0c2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRpZiAoZWRpdGluZykge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ292ZXInLCBkcmFnb3Zlcik7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9uKCdkcmFnbGVhdmUnLCBkcmFnbGVhdmUpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJvcCcsIGRyb3ApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJhZ292ZXInLCBkcmFnb3Zlcik7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQub2ZmKCdkcm9wJywgZHJvcCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9