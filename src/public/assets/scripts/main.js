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
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', ["$scope", "TransectImage", "$attrs", "$element", "$timeout", function ($scope, TransectImage, $attrs, $element, $timeout) {
		"use strict";

		var element = $element[0];
		var boundingRect, timeoutPromise;
		// add this much images for each step
		var step = 20;
		// offset of the element bottom to the window lower bound in pixels at 
		// which a new bunch of images should be displayed
		var newStepOffset = 100;

		var needsNewStep = function () {
			boundingRect = element.getBoundingClientRect();
			return boundingRect.bottom <= window.innerHeight + newStepOffset;
		};

		var checkLowerBound = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				timeoutPromise = $timeout(initialize, 500);
			} else {
				// viewport is full, now switch to event listeners for loading
				$timeout.cancel(timeoutPromise);
				window.addEventListener('scroll', checkLowerBound);
				window.addEventListener('resize', checkLowerBound);
			}
		};

		// array of all image ids of this transect
		$scope.images = TransectImage.query({transect_id: $attrs.transectId});
		// url prefix for the image index page
		$scope.imageUrl = $attrs.imageUrl;
		// url prefix for the image api endpoint
		$scope.apiUrl = $attrs.apiUrl;
		// number of currently shown images
		$scope.limit = 20;

		$timeout(initialize());
	}]
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYW5zZWN0cy9tYWluLmpzIiwicHJvamVjdHMvY29udHJvbGxlcnMvUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlci5qcyIsInByb2plY3RzL2NvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdHNDb250cm9sbGVyLmpzIiwidHJhbnNlY3RzL2NvbnRyb2xsZXJzL0ltYWdlc0NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGEgc2luZ2xlIHRyYW5zZWN0IGluIHRoZSB0cmFuc2VjdCBsaXN0IG9mIHRoZVxuICogcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG50cnkge1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0VHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRtb2RhbCwgUHJvamVjdFRyYW5zZWN0LCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzaG93Q29uZmlybWF0aW9uTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtRGVsZXRlVHJhbnNlY3RNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtb2RhbEluc3RhbmNlO1xuXHRcdH07XG5cblx0XHR2YXIgcmVtb3ZlU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmVUcmFuc2VjdCgkc2NvcGUuJGluZGV4KTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlbW92ZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0c2hvd0NvbmZpcm1hdGlvbk1vZGFsKCkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRcdGlmIChyZXN1bHQgPT0gJ2ZvcmNlJykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlbW92ZSh0cnVlKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uIChmb3JjZSkge1xuXHRcdFx0dmFyIHBhcmFtcztcblxuXHRcdFx0aWYgKGZvcmNlKSB7XG5cdFx0XHRcdHBhcmFtcyA9IHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkLCBmb3JjZTogdHJ1ZX07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJhbXMgPSB7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH07XG5cdFx0XHR9XG5cblx0XHRcdFByb2plY3RUcmFuc2VjdC5kZXRhY2goXG5cdFx0XHRcdHBhcmFtcywge2lkOiAkc2NvcGUudHJhbnNlY3QuaWR9LFxuXHRcdFx0XHRyZW1vdmVTdWNjZXNzLCByZW1vdmVFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnZWRpdGluZycsIGZ1bmN0aW9uIChlZGl0aW5nKSB7XG5cdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xufSBjYXRjaCAoZSkge1xuXHQvLyBkaWFzLnByb2plY3RzIGlzIG5vdCBsb2FkZWQgb24gdGhpcyBwYWdlXG59IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgdHJhbnNlY3RzIG9mIGEgcHJvamVjdC5cbiAqL1xudHJ5IHtcbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdFRyYW5zZWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0VHJhbnNlY3QpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS50cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkIH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVRyYW5zZWN0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHQkc2NvcGUudHJhbnNlY3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblxuXHRcdC8vIGxlYXZlIGVkaXRpbmcgbW9kZSB3aGVuIHRoZXJlIGFyZSBubyBtb3JlIHRyYW5zZWN0cyB0byBlZGl0XG5cdFx0JHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3RyYW5zZWN0cycsIGZ1bmN0aW9uICh0cmFuc2VjdHMpIHtcblx0XHRcdGlmICh0cmFuc2VjdHMgJiYgdHJhbnNlY3RzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHQkc2NvcGUuZWRpdGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xufSBjYXRjaCAoZSkge1xuXHQvLyBkaWFzLnByb2plY3RzIGlzIG5vdCBsb2FkZWQgb24gdGhpcyBwYWdlXG59IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgVHJhbnNlY3RJbWFnZSwgJGF0dHJzLCAkZWxlbWVudCwgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbXVjaCBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdCBcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmdSZWN0LmJvdHRvbSA8PSB3aW5kb3cuaW5uZXJIZWlnaHQgKyBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGF0dGVtcHRzIHRvIGZpbGwgdGhlIGN1cnJlbnQgdmlld3BvcnQgd2l0aCBpbWFnZXNcblx0XHQvLyB1c2VzICR0aW1lb3V0IHRvIHdhaXQgZm9yIERPTSByZW5kZXJpbmcsIHRoZW4gY2hlY2tzIGFnYWluXG5cdFx0dmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoaW5pdGlhbGl6ZSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIGlkcyBvZiB0aGlzIHRyYW5zZWN0XG5cdFx0JHNjb3BlLmltYWdlcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAkYXR0cnMudHJhbnNlY3RJZH0pO1xuXHRcdC8vIHVybCBwcmVmaXggZm9yIHRoZSBpbWFnZSBpbmRleCBwYWdlXG5cdFx0JHNjb3BlLmltYWdlVXJsID0gJGF0dHJzLmltYWdlVXJsO1xuXHRcdC8vIHVybCBwcmVmaXggZm9yIHRoZSBpbWFnZSBhcGkgZW5kcG9pbnRcblx0XHQkc2NvcGUuYXBpVXJsID0gJGF0dHJzLmFwaVVybDtcblx0XHQvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuXHRcdCRzY29wZS5saW1pdCA9IDIwO1xuXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSgpKTtcblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=