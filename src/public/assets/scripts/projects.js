/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectController
 * @memberOf dias.projects
 * @description Controller for a single transect in the transect list of the
 * project index page.
 */
angular.module('dias.projects').controller('ProjectTransectController', ["$scope", "$element", "$uibModal", "ProjectTransect", "msg", function ($scope, $element, $uibModal, ProjectTransect, msg) {
		"use strict";

		var showConfirmationModal = function () {
			var modalInstance = $uibModal.open({
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSwyRkFBQSxVQUFBLFFBQUEsVUFBQSxXQUFBLGlCQUFBLEtBQUE7RUFDQTs7RUFFQSxJQUFBLHdCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBLFVBQUEsS0FBQTtJQUNBLGFBQUE7SUFDQSxNQUFBOzs7R0FHQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBLGVBQUEsT0FBQTs7O0VBR0EsSUFBQSxjQUFBLFVBQUEsVUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLEtBQUE7SUFDQSx3QkFBQSxPQUFBLEtBQUEsVUFBQSxRQUFBO0tBQ0EsSUFBQSxVQUFBLFNBQUE7TUFDQSxPQUFBLE9BQUE7WUFDQTtNQUNBLE9BQUE7OztVQUdBO0lBQ0EsSUFBQSxjQUFBOzs7O0VBSUEsT0FBQSxjQUFBLFlBQUE7R0FDQSxPQUFBLFdBQUE7OztFQUdBLE9BQUEsZUFBQSxZQUFBO0dBQ0EsT0FBQSxXQUFBOzs7RUFHQSxPQUFBLFNBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQTs7R0FFQSxJQUFBLE9BQUE7SUFDQSxTQUFBLENBQUEsWUFBQSxPQUFBLFdBQUEsT0FBQTtVQUNBO0lBQ0EsU0FBQSxDQUFBLFlBQUEsT0FBQTs7O0dBR0EsZ0JBQUE7SUFDQSxRQUFBLENBQUEsSUFBQSxPQUFBLFNBQUE7SUFDQSxlQUFBOzs7O0VBSUEsT0FBQSxPQUFBLFdBQUEsVUFBQSxTQUFBO0dBQ0EsSUFBQSxDQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7O0FDeERBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLDREQUFBLFVBQUEsUUFBQSxpQkFBQTtFQUNBOztFQUVBLE9BQUEsWUFBQSxnQkFBQSxNQUFBLEVBQUEsWUFBQSxPQUFBOztFQUVBLE9BQUEsT0FBQSxZQUFBO0dBQ0EsT0FBQSxVQUFBLENBQUEsT0FBQTs7O0VBR0EsT0FBQSxpQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLFVBQUEsT0FBQSxPQUFBOzs7O0VBSUEsT0FBQSxpQkFBQSxhQUFBLFVBQUEsV0FBQTtHQUNBLElBQUEsYUFBQSxVQUFBLFdBQUEsR0FBQTtJQUNBLE9BQUEsVUFBQTs7Ozs7QUFLQSIsImZpbGUiOiJwcm9qZWN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBhIHNpbmdsZSB0cmFuc2VjdCBpbiB0aGUgdHJhbnNlY3QgbGlzdCBvZiB0aGVcbiAqIHByb2plY3QgaW5kZXggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR1aWJNb2RhbCwgUHJvamVjdFRyYW5zZWN0LCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzaG93Q29uZmlybWF0aW9uTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtRGVsZXRlVHJhbnNlY3RNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtb2RhbEluc3RhbmNlO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmVUcmFuc2VjdCgkc2NvcGUuJGluZGV4KTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlbW92ZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0c2hvd0NvbmZpcm1hdGlvbk1vZGFsKCkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRcdGlmIChyZXN1bHQgPT0gJ2ZvcmNlJykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlbW92ZSh0cnVlKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uIChmb3JjZSkge1xuXHRcdFx0dmFyIHBhcmFtcztcblxuXHRcdFx0aWYgKGZvcmNlKSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkLCBmb3JjZTogdHJ1ZX07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJhbXMgPSB7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH07XG5cdFx0XHR9XG5cblx0XHRcdFByb2plY3RUcmFuc2VjdC5kZXRhY2goXG5cdFx0XHRcdHBhcmFtcywge2lkOiAkc2NvcGUudHJhbnNlY3QuaWR9LFxuXHRcdFx0XHRyZW1vdmVTdWNjZXNzLCByZW1vdmVFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnZWRpdGluZycsIGZ1bmN0aW9uIChlZGl0aW5nKSB7XG5cdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgdHJhbnNlY3RzIG9mIGEgcHJvamVjdC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2plY3RUcmFuc2VjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQgfSk7XG5cblx0XHQkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlVHJhbnNlY3QgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdCRzY29wZS50cmFuc2VjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9O1xuXG5cdFx0Ly8gbGVhdmUgZWRpdGluZyBtb2RlIHdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgdHJhbnNlY3RzIHRvIGVkaXRcblx0XHQkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbigndHJhbnNlY3RzJywgZnVuY3Rpb24gKHRyYW5zZWN0cykge1xuXHRcdFx0aWYgKHRyYW5zZWN0cyAmJiB0cmFuc2VjdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5lZGl0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=