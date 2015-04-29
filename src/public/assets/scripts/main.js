/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api']);

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
			template: '<img src="{{src}}" data-ng-if="src">',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYW5zZWN0cy9tYWluLmpzIiwidHJhbnNlY3RzL2RpcmVjdGl2ZXMvbGF6eUltZy5qcyIsInByb2plY3RzL2NvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdENvbnRyb2xsZXIuanMiLCJwcm9qZWN0cy9jb250cm9sbGVycy9Qcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWdcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEFuIGltYWdlIGVsZW1lbnQgdGhhdCBsb2FkcyBhbmQgc2hvd3MgdGhlIGltYWdlIG9ubHkgaWYgaXQgaXMgXG4gKiB2aXNpYmxlIGFuZCBoaWRlcyBpdCBhZ2FpbiB3aGVuIGl0IGlzIGhpZGRlbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWcnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRcdHNjb3BlOiB0cnVlLFxuXHRcdFx0dGVtcGxhdGU6ICc8aW1nIHNyYz1cInt7c3JjfX1cIiBkYXRhLW5nLWlmPVwic3JjXCI+Jyxcblx0XHRcdHJlcGxhY2U6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzKSB7XG5cdFx0XHRcdHZhciByZWN0LCBpc1Zpc2libGUsIHNldFNyYywgY2hlY2s7XG5cdFx0XHRcdHZhciBlbG0gPSAkZWxlbWVudFswXTtcblxuXHRcdFx0XHRpc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmVjdCA9IGVsbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0XHRyZXR1cm4gcmVjdC5ib3R0b20gPj0gMCAmJiByZWN0LnRvcCA8PSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0c2V0U3JjID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVjayk7XG5cdFx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrKTtcblx0XHRcdFx0XHQkc2NvcGUuc3JjID0gJGF0dHJzLmxhenlJbWc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y2hlY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKGlzVmlzaWJsZSgpKSAkc2NvcGUuJGFwcGx5KHNldFNyYyk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGluaXRpYWwgY2hlY2tcblx0XHRcdFx0aWYgKGlzVmlzaWJsZSgpKSBzZXRTcmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGEgc2luZ2xlIHRyYW5zZWN0IGluIHRoZSB0cmFuc2VjdCBsaXN0IG9mIHRoZVxuICogcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG50cnkge1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRtb2RhbCwgUHJvamVjdFRyYW5zZWN0LCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzaG93Q29uZmlybWF0aW9uTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtRGVsZXRlVHJhbnNlY3RNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtb2RhbEluc3RhbmNlO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmVUcmFuc2VjdCgkc2NvcGUuJGluZGV4KTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlbW92ZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0c2hvd0NvbmZpcm1hdGlvbk1vZGFsKCkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRcdGlmIChyZXN1bHQgPT0gJ2ZvcmNlJykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlbW92ZSh0cnVlKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uIChmb3JjZSkge1xuXHRcdFx0dmFyIHBhcmFtcztcblxuXHRcdFx0aWYgKGZvcmNlKSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkLCBmb3JjZTogdHJ1ZX07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJhbXMgPSB7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH07XG5cdFx0XHR9XG5cblx0XHRcdFByb2plY3RUcmFuc2VjdC5kZXRhY2goXG5cdFx0XHRcdHBhcmFtcywge2lkOiAkc2NvcGUudHJhbnNlY3QuaWR9LFxuXHRcdFx0XHRyZW1vdmVTdWNjZXNzLCByZW1vdmVFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnZWRpdGluZycsIGZ1bmN0aW9uIChlZGl0aW5nKSB7XG5cdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xufSBjYXRjaCAoZSkge1xuXHQvLyBkaWFzLnByb2plY3RzIGlzIG5vdCBsb2FkZWQgb24gdGhpcyBwYWdlXG59IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgdHJhbnNlY3RzIG9mIGEgcHJvamVjdC5cbiAqL1xudHJ5IHtcbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdFRyYW5zZWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0VHJhbnNlY3QpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS50cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkIH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVRyYW5zZWN0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHQkc2NvcGUudHJhbnNlY3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblxuXHRcdC8vIGxlYXZlIGVkaXRpbmcgbW9kZSB3aGVuIHRoZXJlIGFyZSBubyBtb3JlIHRyYW5zZWN0cyB0byBlZGl0XG5cdFx0JHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3RyYW5zZWN0cycsIGZ1bmN0aW9uICh0cmFuc2VjdHMpIHtcblx0XHRcdGlmICh0cmFuc2VjdHMgJiYgdHJhbnNlY3RzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHQkc2NvcGUuZWRpdGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xufSBjYXRjaCAoZSkge1xuXHQvLyBkaWFzLnByb2plY3RzIGlzIG5vdCBsb2FkZWQgb24gdGhpcyBwYWdlXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9