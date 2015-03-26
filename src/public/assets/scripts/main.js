/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectController
 * @memberOf dias.projects
 * @description Controller for a single transect in the transect list of the
 * project index page.
 */
angular.module('dias.projects').controller('ProjectTransectController', ["$scope", "$element", "$modal", "ProjectTransect", "msg", function ($scope, $element, $modal, ProjectTransect, msg) {
		"use strict";

		var showConfirmationModal = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteTransectModal.html',
				size: 'sm'
			});

			return modalInstance;
		};

		var removeSuccess = function () {
			$scope.removeTransect($scope.$index);
		};

		var removeError = function (response) {
			if (response.status === 400) {
				showConfirmationModal().result.then(function (result) {
					if (result == 'force') {
						$scope.remove(true);
					} else {
						$scope.cancelRemove();
					}
				});
			} else {
				msg.responseError(response);
			}
		};

		$scope.startRemove = function () {
			$scope.removing = true;
		};

		$scope.cancelRemove = function () {
			$scope.removing = false;
		};

		$scope.remove = function (force) {
			var params;

			if (force) {
				params = {project_id: $scope.projectId, force: true};
			} else {
				params = {project_id: $scope.projectId};
			}

			ProjectTransect.detach(
				params, {id: $scope.transect.id},
				removeSuccess, removeError
			);
		};

		$scope.$watch('editing', function (editing) {
			if (!editing) {
				$scope.cancelRemove();
			}
		});
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectsController
 * @memberOf dias.projects
 * @description Handles modification of the transects of a project.
 */
angular.module('dias.projects').controller('ProjectTransectsController', ["$scope", "ProjectTransect", function ($scope, ProjectTransect) {
		"use strict";

		$scope.transects = ProjectTransect.query({ project_id: $scope.projectId });

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.removeTransect = function (index) {
			$scope.transects.splice(index, 1);
		};

		// leave editing mode when there are no more transects to edit
		$scope.$watchCollection('transects', function (transects) {
			if (transects && transects.length === 0) {
				$scope.editing = false;
			}
		});
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb2plY3RzL2NvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXIuanMiLCJwcm9qZWN0cy9jb250cm9sbGVycy9Qcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGEgc2luZ2xlIHRyYW5zZWN0IGluIHRoZSB0cmFuc2VjdCBsaXN0IG9mIHRoZVxuICogcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJG1vZGFsLCBQcm9qZWN0VHJhbnNlY3QsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNob3dDb25maXJtYXRpb25Nb2RhbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVUcmFuc2VjdE1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIG1vZGFsSW5zdGFuY2U7XG5cdFx0fTtcblxuXHRcdHZhciByZW1vdmVTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92ZVRyYW5zZWN0KCRzY29wZS4kaW5kZXgpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHRzaG93Q29uZmlybWF0aW9uTW9kYWwoKS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCA9PSAnZm9yY2UnKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmVtb3ZlKHRydWUpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG5cdFx0XHR2YXIgcGFyYW1zO1xuXG5cdFx0XHRpZiAoZm9yY2UpIHtcblx0XHRcdFx0cGFyYW1zID0ge3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQsIGZvcmNlOiB0cnVlfTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfTtcblx0XHRcdH1cblxuXHRcdFx0UHJvamVjdFRyYW5zZWN0LmRldGFjaChcblx0XHRcdFx0cGFyYW1zLCB7aWQ6ICRzY29wZS50cmFuc2VjdC5pZH0sXG5cdFx0XHRcdHJlbW92ZVN1Y2Nlc3MsIHJlbW92ZUVycm9yXG5cdFx0XHQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSB0cmFuc2VjdHMgb2YgYSBwcm9qZWN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RUcmFuc2VjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvamVjdFRyYW5zZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUudHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZCB9KTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVUcmFuc2VjdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdFx0JHNjb3BlLnRyYW5zZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH07XG5cblx0XHQvLyBsZWF2ZSBlZGl0aW5nIG1vZGUgd2hlbiB0aGVyZSBhcmUgbm8gbW9yZSB0cmFuc2VjdHMgdG8gZWRpdFxuXHRcdCRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCd0cmFuc2VjdHMnLCBmdW5jdGlvbiAodHJhbnNlY3RzKSB7XG5cdFx0XHRpZiAodHJhbnNlY3RzICYmIHRyYW5zZWN0cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0JHNjb3BlLmVkaXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==