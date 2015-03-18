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
				controller: 'ProjectDeleteModalController'
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

		$scope.delete = function (id) {
			var data = $scope.force ? {id: id, force: true} : {id: id};
			Project.delete(data, deleteSuccess, deleteError);
		};
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5jb3JlJywgJ3VpLmJvb3RzdHJhcCddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRtb2RhbCwgJGF0dHJzLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSgkYXR0cnMuc3VjY2Vzc01zZywgJ3N1Y2Nlc3MnKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuc3VjY2Vzc1JlZGlyZWN0VXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlKCRhdHRycy5lcnJvck1zZywgJ2RhbmdlcicpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkbW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlcidcblx0XHRcdH0pO1xuXG5cdFx0XHRtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0c3dpdGNoIChyZXN1bHQpIHtcblx0XHRcdFx0XHRjYXNlICdzdWNjZXNzJzpcblx0XHRcdFx0XHRcdHN1Y2Nlc3MoKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2Vycm9yJzpcblx0XHRcdFx0XHRcdGVycm9yKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBjb25maXJtYXRpb24gb2YgZGVsZXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuZm9yY2UgPSBmYWxzZTtcblxuXHRcdHZhciBkZWxldGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBzdGF0dXMpIHtcblx0XHRcdCRzY29wZS4kY2xvc2UoJ3N1Y2Nlc3MnKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRlbGV0ZUVycm9yID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHQkc2NvcGUuZm9yY2UgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLiRjbG9zZSgnZXJyb3InKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRhdGEgPSAkc2NvcGUuZm9yY2UgPyB7aWQ6IGlkLCBmb3JjZTogdHJ1ZX0gOiB7aWQ6IGlkfTtcblx0XHRcdFByb2plY3QuZGVsZXRlKGRhdGEsIGRlbGV0ZVN1Y2Nlc3MsIGRlbGV0ZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9