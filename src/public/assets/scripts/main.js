/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.core', 'ui.bootstrap']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', ["$scope", "$modal", "$attrs", "$timeout", function ($scope, $modal, $attrs, $timeout) {
		"use strict";

		var success = function () {
			window.$diasPostMessage($attrs.successMsg, 'success');
			$timeout(function () {
				window.location.href = $attrs.successRedirectUrl;
			}, 2000);
		};

		var error = function () {
			window.$diasPostMessage($attrs.errorMsg, 'danger');
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
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", function ($scope, Role, ProjectUser) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
		};

		var genericError = function (response) {
			var message = response.data.message || "There was an error, sorry.";
			window.$diasPostMessage(message, 'danger');
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
				success, genericError
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

			user.$detach({project_id: $scope.project.id}, success, genericError);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlckNvbnRhaW5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5jb3JlJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSgkYXR0cnMuc3VjY2Vzc01zZywgJ3N1Y2Nlc3MnKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuc3VjY2Vzc1JlZGlyZWN0VXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlKCRhdHRycy5lcnJvck1zZywgJ2RhbmdlcicpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkbW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlcicsXG5cdFx0XHRcdHNjb3BlOiAkc2NvcGVcblx0XHRcdH0pO1xuXG5cdFx0XHRtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0c3dpdGNoIChyZXN1bHQpIHtcblx0XHRcdFx0XHRjYXNlICdzdWNjZXNzJzpcblx0XHRcdFx0XHRcdHN1Y2Nlc3MoKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2Vycm9yJzpcblx0XHRcdFx0XHRcdGVycm9yKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBjb25maXJtYXRpb24gb2YgZGVsZXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuZm9yY2UgPSBmYWxzZTtcblxuXHRcdHZhciBkZWxldGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBzdGF0dXMpIHtcblx0XHRcdCRzY29wZS4kY2xvc2UoJ3N1Y2Nlc3MnKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRlbGV0ZUVycm9yID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHQkc2NvcGUuZm9yY2UgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLiRjbG9zZSgnZXJyb3InKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAkc2NvcGUuZm9yY2UgPyB7Zm9yY2U6IHRydWV9IDoge307XG5cdFx0XHQkc2NvcGUucHJvamVjdC4kZGVsZXRlKHBhcmFtcywgZGVsZXRlU3VjY2VzcywgZGVsZXRlRXJyb3IpO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmRleENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gUm9vdCBjb250cm9sbGVyIG9mIHRoZSBwcm9qZWN0IGluZGV4IHBhZ2UuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdEluZGV4Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycywgUHJvamVjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6ICRhdHRycy5wcm9qZWN0SWR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgaW5mb3JtYXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0XG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0TWVtYmVyc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIG1lbWJlcnMgb2YgYSBwcm9qZWN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJvbGUsIFByb2plY3RVc2VyKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZ2V0VXNlciA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgZ2VuZXJpY0Vycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHR2YXIgbWVzc2FnZSA9IHJlc3BvbnNlLmRhdGEubWVzc2FnZSB8fCBcIlRoZXJlIHdhcyBhbiBlcnJvciwgc29ycnkuXCI7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZShtZXNzYWdlLCAnZGFuZ2VyJyk7XG5cdFx0fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHJvbGVzQXJyYXkpIHtcblx0XHRcdCRzY29wZS5yb2xlcyA9IHt9O1xuXHRcdFx0Zm9yICh2YXIgaSA9IHJvbGVzQXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0JHNjb3BlLnJvbGVzW3JvbGVzQXJyYXlbaV0ubmFtZV0gPSByb2xlc0FycmF5W2ldLmlkO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnByb2plY3QuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUudXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkIH0pO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNoYW5nZVVzZXJSb2xlID0gZnVuY3Rpb24gKHVzZXJJZCwgcm9sZSkge1xuXHRcdFx0dmFyIHVzZXIgPSBnZXRVc2VyKHVzZXJJZCk7XG5cdFx0XHR2YXIgcm9sZUlkID0gJHNjb3BlLnJvbGVzW3JvbGVdO1xuXG5cdFx0XHQvLyBubyBhY3Rpb24gcmVxdWlyZWRcblx0XHRcdGlmICh1c2VyLnByb2plY3Rfcm9sZV9pZCA9PSByb2xlSWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dXNlci5wcm9qZWN0X3JvbGVfaWQgPSByb2xlSWQ7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5zYXZlKFxuXHRcdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3QuaWR9LFxuXHRcdFx0XHR7aWQ6IHVzZXIuaWQsIHByb2plY3Rfcm9sZV9pZDogcm9sZUlkfSxcblx0XHRcdFx0c3VjY2VzcywgZ2VuZXJpY0Vycm9yXG5cdFx0XHQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlVXNlciA9IGZ1bmN0aW9uICh1c2VySWQpIHtcblx0XHRcdHZhciBpbmRleDtcblx0XHRcdHZhciB1c2VyO1xuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0JHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRmb3IgKHZhciBpID0gJHNjb3BlLnVzZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmICgkc2NvcGUudXNlcnNbaV0uaWQgPT0gdXNlcklkKSB7XG5cdFx0XHRcdFx0dXNlciA9ICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0XHRpbmRleCA9IGk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dXNlci4kZGV0YWNoKHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sIHN1Y2Nlc3MsIGdlbmVyaWNFcnJvcik7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgcHJvamVjdCBtZW1iZXIgZWxlbWVudCBpbiB0aGUgcHJvamVjdCBtZW1iZXJzIG92ZXJ2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHR2YXIgZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xuICBcdFx0XHRcdFx0ZS5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIHNjb3BlLnVzZXIuaWQpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIGRpc2FibGUgZHJhZ2dpbmcgd2hlbiByZW1vdmluZyBpcyBpbiBwcm9ncmVzc1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ3JlbW92aW5nJywgZnVuY3Rpb24gKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0aWYgKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8vIHdoZW4gZWRpdGluZyBpcyBzd2l0Y2hlZCBvZmYsIHJlbW92aW5nIGlzIGNhbmNlbGVkLCB0b29cblx0XHRcdFx0c2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0XHRcdHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHQkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92ZVVzZXIoJHNjb3BlLnVzZXIuaWQpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgcHJvamVjdE1lbWJlckNvbnRhaW5lclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250YWlucyBwcm9qZWN0IG1lbWJlcnMgb2YgYSBjZXJ0YWluIHJvbGUuIE5ldyBtZW1iZXJzIGNhbiBiZSBkcm9wcGVkIGluLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlckNvbnRhaW5lcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0Ly8gZWFjaCBjb250YWluZXIgaGFzIGl0cyBvd24gc2NvcGVcblx0XHRcdHNjb3BlOiB0cnVlLFxuXHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHR2YXIgZHJhZ292ZXIgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0XHQgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBkcmFnbGVhdmUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGRyb3AgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0c2NvcGUuY2hhbmdlVXNlclJvbGUoXG5cdFx0XHRcdFx0XHQvLyB1c2VyIGlkXG5cdFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJyksXG5cdFx0XHRcdFx0XHQvLyBuZXcgcm9sZSBuYW1lXG5cdFx0XHRcdFx0XHRhdHRycy5yb2xlXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gb25seSBhbGxvdyBkcm9wcGluZyBpZiBlZGl0aW5nXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgnZWRpdGluZycsIGZ1bmN0aW9uIChlZGl0aW5nKSB7XG5cdFx0XHRcdFx0aWYgKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub24oJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQub24oJ2Ryb3AnLCBkcm9wKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vZmYoJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vZmYoJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJvcCcsIGRyb3ApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==