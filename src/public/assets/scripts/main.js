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
 * @example

 */
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", function ($scope, Role, ProjectUser) {
		"use strict";
		var initRoles = function (rolesArray) {
			$scope.roles = {};
			for (var i = rolesArray.length - 1; i >= 0; i--) {
				$scope.roles[rolesArray[i].name] = rolesArray[i].id;
			}
		};

		Role.query(initRoles);

		$scope.project.$promise.then(function () {
			$scope.users = ProjectUser.query({ project_id: $scope.project.id });
		});
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RNZW1iZXJzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5jb3JlJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSgkYXR0cnMuc3VjY2Vzc01zZywgJ3N1Y2Nlc3MnKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuc3VjY2Vzc1JlZGlyZWN0VXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlKCRhdHRycy5lcnJvck1zZywgJ2RhbmdlcicpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkbW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlcicsXG5cdFx0XHRcdHNjb3BlOiAkc2NvcGVcblx0XHRcdH0pO1xuXG5cdFx0XHRtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0c3dpdGNoIChyZXN1bHQpIHtcblx0XHRcdFx0XHRjYXNlICdzdWNjZXNzJzpcblx0XHRcdFx0XHRcdHN1Y2Nlc3MoKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2Vycm9yJzpcblx0XHRcdFx0XHRcdGVycm9yKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBjb25maXJtYXRpb24gb2YgZGVsZXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuZm9yY2UgPSBmYWxzZTtcblxuXHRcdHZhciBkZWxldGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBzdGF0dXMpIHtcblx0XHRcdCRzY29wZS4kY2xvc2UoJ3N1Y2Nlc3MnKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRlbGV0ZUVycm9yID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHQkc2NvcGUuZm9yY2UgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLiRjbG9zZSgnZXJyb3InKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAkc2NvcGUuZm9yY2UgPyB7Zm9yY2U6IHRydWV9IDoge307XG5cdFx0XHQkc2NvcGUucHJvamVjdC4kZGVsZXRlKHBhcmFtcywgZGVsZXRlU3VjY2VzcywgZGVsZXRlRXJyb3IpO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmRleENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gUm9vdCBjb250cm9sbGVyIG9mIHRoZSBwcm9qZWN0IGluZGV4IHBhZ2UuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdEluZGV4Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycywgUHJvamVjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6ICRhdHRycy5wcm9qZWN0SWR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgaW5mb3JtYXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0XG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0TWVtYmVyc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIG1lbWJlcnMgb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJvbGUsIFByb2plY3RVc2VyKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGluaXRSb2xlcyA9IGZ1bmN0aW9uIChyb2xlc0FycmF5KSB7XG5cdFx0XHQkc2NvcGUucm9sZXMgPSB7fTtcblx0XHRcdGZvciAodmFyIGkgPSByb2xlc0FycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdCRzY29wZS5yb2xlc1tyb2xlc0FycmF5W2ldLm5hbWVdID0gcm9sZXNBcnJheVtpXS5pZDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Um9sZS5xdWVyeShpbml0Um9sZXMpO1xuXG5cdFx0JHNjb3BlLnByb2plY3QuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUudXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkIH0pO1xuXHRcdH0pO1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9