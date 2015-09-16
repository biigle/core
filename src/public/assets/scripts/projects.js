/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectController
 * @memberOf dias.projects
 * @description Controller for a single transect in the transect list of the
 * project index page.
 */
try {
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
} catch (e) {
	// dias.projects is not loaded on this page
}
/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectsController
 * @memberOf dias.projects
 * @description Handles modification of the transects of a project.
 */
try {
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
} catch (e) {
	// dias.projects is not loaded on this page
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUFRQSxJQUFBO0FBQ0EsUUFBQSxPQUFBLGlCQUFBLFdBQUEsd0ZBQUEsVUFBQSxRQUFBLFVBQUEsUUFBQSxpQkFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQSx3QkFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQSxPQUFBLEtBQUE7SUFDQSxhQUFBO0lBQ0EsTUFBQTs7O0dBR0EsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxZQUFBO0dBQ0EsT0FBQSxlQUFBLE9BQUE7OztFQUdBLElBQUEsY0FBQSxVQUFBLFVBQUE7R0FDQSxJQUFBLFNBQUEsV0FBQSxLQUFBO0lBQ0Esd0JBQUEsT0FBQSxLQUFBLFVBQUEsUUFBQTtLQUNBLElBQUEsVUFBQSxTQUFBO01BQ0EsT0FBQSxPQUFBO1lBQ0E7TUFDQSxPQUFBOzs7VUFHQTtJQUNBLElBQUEsY0FBQTs7OztFQUlBLE9BQUEsY0FBQSxZQUFBO0dBQ0EsT0FBQSxXQUFBOzs7RUFHQSxPQUFBLGVBQUEsWUFBQTtHQUNBLE9BQUEsV0FBQTs7O0VBR0EsT0FBQSxTQUFBLFVBQUEsT0FBQTtHQUNBLElBQUE7O0dBRUEsSUFBQSxPQUFBO0lBQ0EsU0FBQSxDQUFBLFlBQUEsT0FBQSxXQUFBLE9BQUE7VUFDQTtJQUNBLFNBQUEsQ0FBQSxZQUFBLE9BQUE7OztHQUdBLGdCQUFBO0lBQ0EsUUFBQSxDQUFBLElBQUEsT0FBQSxTQUFBO0lBQ0EsZUFBQTs7OztFQUlBLE9BQUEsT0FBQSxXQUFBLFVBQUEsU0FBQTtHQUNBLElBQUEsQ0FBQSxTQUFBO0lBQ0EsT0FBQTs7Ozs7RUFLQSxPQUFBLEdBQUE7Ozs7Ozs7Ozs7QUM5REEsSUFBQTtBQUNBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLDREQUFBLFVBQUEsUUFBQSxpQkFBQTtFQUNBOztFQUVBLE9BQUEsWUFBQSxnQkFBQSxNQUFBLEVBQUEsWUFBQSxPQUFBOztFQUVBLE9BQUEsT0FBQSxZQUFBO0dBQ0EsT0FBQSxVQUFBLENBQUEsT0FBQTs7O0VBR0EsT0FBQSxpQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLFVBQUEsT0FBQSxPQUFBOzs7O0VBSUEsT0FBQSxpQkFBQSxhQUFBLFVBQUEsV0FBQTtHQUNBLElBQUEsYUFBQSxVQUFBLFdBQUEsR0FBQTtJQUNBLE9BQUEsVUFBQTs7Ozs7RUFLQSxPQUFBLEdBQUE7O0NBRUEiLCJmaWxlIjoicHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgYSBzaW5nbGUgdHJhbnNlY3QgaW4gdGhlIHRyYW5zZWN0IGxpc3Qgb2YgdGhlXG4gKiBwcm9qZWN0IGluZGV4IHBhZ2UuXG4gKi9cbnRyeSB7XG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJG1vZGFsLCBQcm9qZWN0VHJhbnNlY3QsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNob3dDb25maXJtYXRpb25Nb2RhbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVUcmFuc2VjdE1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIG1vZGFsSW5zdGFuY2U7XG5cdFx0fTtcblxuXHRcdHZhciByZW1vdmVTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92ZVRyYW5zZWN0KCRzY29wZS4kaW5kZXgpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHRzaG93Q29uZmlybWF0aW9uTW9kYWwoKS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCA9PSAnZm9yY2UnKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmVtb3ZlKHRydWUpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG5cdFx0XHR2YXIgcGFyYW1zO1xuXG5cdFx0XHRpZiAoZm9yY2UpIHtcblx0XHRcdFx0cGFyYW1zID0ge3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQsIGZvcmNlOiB0cnVlfTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfTtcblx0XHRcdH1cblxuXHRcdFx0UHJvamVjdFRyYW5zZWN0LmRldGFjaChcblx0XHRcdFx0cGFyYW1zLCB7aWQ6ICRzY29wZS50cmFuc2VjdC5pZH0sXG5cdFx0XHRcdHJlbW92ZVN1Y2Nlc3MsIHJlbW92ZUVycm9yXG5cdFx0XHQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG59IGNhdGNoIChlKSB7XG5cdC8vIGRpYXMucHJvamVjdHMgaXMgbm90IGxvYWRlZCBvbiB0aGlzIHBhZ2Vcbn0iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSB0cmFuc2VjdHMgb2YgYSBwcm9qZWN0LlxuICovXG50cnkge1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2plY3RUcmFuc2VjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQgfSk7XG5cblx0XHQkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlVHJhbnNlY3QgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdCRzY29wZS50cmFuc2VjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9O1xuXG5cdFx0Ly8gbGVhdmUgZWRpdGluZyBtb2RlIHdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgdHJhbnNlY3RzIHRvIGVkaXRcblx0XHQkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbigndHJhbnNlY3RzJywgZnVuY3Rpb24gKHRyYW5zZWN0cykge1xuXHRcdFx0aWYgKHRyYW5zZWN0cyAmJiB0cmFuc2VjdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5lZGl0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG59IGNhdGNoIChlKSB7XG5cdC8vIGRpYXMucHJvamVjdHMgaXMgbm90IGxvYWRlZCBvbiB0aGlzIHBhZ2Vcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=