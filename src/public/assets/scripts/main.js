/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api']);

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
/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name lazyImg
 * @memberOf dias.transects
 * @description An image element that loads and shows the image only if it is 
 * visible and hides it again when it is hidden for better performance.
 */
angular.module('dias.transects').directive('lazyImg', function () {
		"use strict";

		return {
			restrict: 'A',
			scope: true,
			template: '<img data-ng-src="{{src}}">',
			replace: true,
			controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
				var rect, isVisible, setSrc, check;
				var elm = $element[0];

				isVisible = function () {
					rect = elm.getBoundingClientRect();
					return rect.bottom >= 0 && rect.top <= window.innerHeight;
				};

				setSrc = function () {
					window.removeEventListener('scroll', check);
					window.removeEventListener('resize', check);
					$scope.src = $attrs.lazyImg;
				};

				check = function () {
					if (isVisible()) $scope.$apply(setSrc);
				};

				window.addEventListener('scroll', check);
				window.addEventListener('resize', check);
				
				// initial check
				if (isVisible()) setSrc();
			}]
		};
	}
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYW5zZWN0cy9tYWluLmpzIiwicHJvamVjdHMvY29udHJvbGxlcnMvUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlci5qcyIsInByb2plY3RzL2NvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdHNDb250cm9sbGVyLmpzIiwidHJhbnNlY3RzL2RpcmVjdGl2ZXMvbGF6eUltZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgYSBzaW5nbGUgdHJhbnNlY3QgaW4gdGhlIHRyYW5zZWN0IGxpc3Qgb2YgdGhlXG4gKiBwcm9qZWN0IGluZGV4IHBhZ2UuXG4gKi9cbnRyeSB7XG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJG1vZGFsLCBQcm9qZWN0VHJhbnNlY3QsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNob3dDb25maXJtYXRpb25Nb2RhbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVUcmFuc2VjdE1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIG1vZGFsSW5zdGFuY2U7XG5cdFx0fTtcblxuXHRcdHZhciByZW1vdmVTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92ZVRyYW5zZWN0KCRzY29wZS4kaW5kZXgpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkge1xuXHRcdFx0XHRzaG93Q29uZmlybWF0aW9uTW9kYWwoKS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCA9PSAnZm9yY2UnKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmVtb3ZlKHRydWUpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG5cdFx0XHR2YXIgcGFyYW1zO1xuXG5cdFx0XHRpZiAoZm9yY2UpIHtcblx0XHRcdFx0cGFyYW1zID0ge3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQsIGZvcmNlOiB0cnVlfTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfTtcblx0XHRcdH1cblxuXHRcdFx0UHJvamVjdFRyYW5zZWN0LmRldGFjaChcblx0XHRcdFx0cGFyYW1zLCB7aWQ6ICRzY29wZS50cmFuc2VjdC5pZH0sXG5cdFx0XHRcdHJlbW92ZVN1Y2Nlc3MsIHJlbW92ZUVycm9yXG5cdFx0XHQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG59IGNhdGNoIChlKSB7XG5cdC8vIGRpYXMucHJvamVjdHMgaXMgbm90IGxvYWRlZCBvbiB0aGlzIHBhZ2Vcbn0iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgbW9kaWZpY2F0aW9uIG9mIHRoZSB0cmFuc2VjdHMgb2YgYSBwcm9qZWN0LlxuICovXG50cnkge1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2plY3RUcmFuc2VjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWQgfSk7XG5cblx0XHQkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlVHJhbnNlY3QgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdCRzY29wZS50cmFuc2VjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9O1xuXG5cdFx0Ly8gbGVhdmUgZWRpdGluZyBtb2RlIHdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgdHJhbnNlY3RzIHRvIGVkaXRcblx0XHQkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbigndHJhbnNlY3RzJywgZnVuY3Rpb24gKHRyYW5zZWN0cykge1xuXHRcdFx0aWYgKHRyYW5zZWN0cyAmJiB0cmFuc2VjdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5lZGl0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG59IGNhdGNoIChlKSB7XG5cdC8vIGRpYXMucHJvamVjdHMgaXMgbm90IGxvYWRlZCBvbiB0aGlzIHBhZ2Vcbn0iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWdcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEFuIGltYWdlIGVsZW1lbnQgdGhhdCBsb2FkcyBhbmQgc2hvd3MgdGhlIGltYWdlIG9ubHkgaWYgaXQgaXMgXG4gKiB2aXNpYmxlIGFuZCBoaWRlcyBpdCBhZ2FpbiB3aGVuIGl0IGlzIGhpZGRlbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWcnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRcdHNjb3BlOiB0cnVlLFxuXHRcdFx0dGVtcGxhdGU6ICc8aW1nIGRhdGEtbmctc3JjPVwie3tzcmN9fVwiPicsXG5cdFx0XHRyZXBsYWNlOiB0cnVlLFxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycykge1xuXHRcdFx0XHR2YXIgcmVjdCwgaXNWaXNpYmxlLCBzZXRTcmMsIGNoZWNrO1xuXHRcdFx0XHR2YXIgZWxtID0gJGVsZW1lbnRbMF07XG5cblx0XHRcdFx0aXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJlY3QgPSBlbG0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRcdFx0cmV0dXJuIHJlY3QuYm90dG9tID49IDAgJiYgcmVjdC50b3AgPD0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHNldFNyYyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2hlY2spO1xuXHRcdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVjayk7XG5cdFx0XHRcdFx0JHNjb3BlLnNyYyA9ICRhdHRycy5sYXp5SW1nO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNoZWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGlmIChpc1Zpc2libGUoKSkgJHNjb3BlLiRhcHBseShzZXRTcmMpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVjayk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVjayk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBpbml0aWFsIGNoZWNrXG5cdFx0XHRcdGlmIChpc1Zpc2libGUoKSkgc2V0U3JjKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==