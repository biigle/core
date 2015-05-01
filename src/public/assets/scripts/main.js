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
				timeoutPromise = $timeout(initialize, 50);
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

		initialize();
	}]
);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYW5zZWN0cy9tYWluLmpzIiwicHJvamVjdHMvY29udHJvbGxlcnMvUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlci5qcyIsInByb2plY3RzL2NvbnRyb2xsZXJzL1Byb2plY3RUcmFuc2VjdHNDb250cm9sbGVyLmpzIiwidHJhbnNlY3RzL2NvbnRyb2xsZXJzL0ltYWdlc0NvbnRyb2xsZXIuanMiLCJ0cmFuc2VjdHMvZGlyZWN0aXZlcy9sYXp5SW1nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBhIHNpbmdsZSB0cmFuc2VjdCBpbiB0aGUgdHJhbnNlY3QgbGlzdCBvZiB0aGVcbiAqIHByb2plY3QgaW5kZXggcGFnZS5cbiAqL1xudHJ5IHtcbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdFRyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkbW9kYWwsIFByb2plY3RUcmFuc2VjdCwgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc2hvd0NvbmZpcm1hdGlvbk1vZGFsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkbW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZVRyYW5zZWN0TW9kYWwuaHRtbCcsXG5cdFx0XHRcdHNpemU6ICdzbSdcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbW9kYWxJbnN0YW5jZTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlbW92ZVN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVtb3ZlVHJhbnNlY3QoJHNjb3BlLiRpbmRleCk7XG5cdFx0fTtcblxuXHRcdHZhciByZW1vdmVFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7XG5cdFx0XHRcdHNob3dDb25maXJtYXRpb25Nb2RhbCgpLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0XHRpZiAocmVzdWx0ID09ICdmb3JjZScpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5yZW1vdmUodHJ1ZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdCRzY29wZS5jYW5jZWxSZW1vdmUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSB0cnVlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2FuY2VsUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoZm9yY2UpIHtcblx0XHRcdHZhciBwYXJhbXM7XG5cblx0XHRcdGlmIChmb3JjZSkge1xuXHRcdFx0XHRwYXJhbXMgPSB7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZCwgZm9yY2U6IHRydWV9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyYW1zID0ge3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9O1xuXHRcdFx0fVxuXG5cdFx0XHRQcm9qZWN0VHJhbnNlY3QuZGV0YWNoKFxuXHRcdFx0XHRwYXJhbXMsIHtpZDogJHNjb3BlLnRyYW5zZWN0LmlkfSxcblx0XHRcdFx0cmVtb3ZlU3VjY2VzcywgcmVtb3ZlRXJyb3Jcblx0XHRcdCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0aWYgKCFlZGl0aW5nKSB7XG5cdFx0XHRcdCRzY29wZS5jYW5jZWxSZW1vdmUoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gZGlhcy5wcm9qZWN0cyBpcyBub3QgbG9hZGVkIG9uIHRoaXMgcGFnZVxufSIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdFRyYW5zZWN0c0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIHRyYW5zZWN0cyBvZiBhIHByb2plY3QuXG4gKi9cbnRyeSB7XG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RUcmFuc2VjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvamVjdFRyYW5zZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUudHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZCB9KTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVUcmFuc2VjdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdFx0JHNjb3BlLnRyYW5zZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH07XG5cblx0XHQvLyBsZWF2ZSBlZGl0aW5nIG1vZGUgd2hlbiB0aGVyZSBhcmUgbm8gbW9yZSB0cmFuc2VjdHMgdG8gZWRpdFxuXHRcdCRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCd0cmFuc2VjdHMnLCBmdW5jdGlvbiAodHJhbnNlY3RzKSB7XG5cdFx0XHRpZiAodHJhbnNlY3RzICYmIHRyYW5zZWN0cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0JHNjb3BlLmVkaXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gZGlhcy5wcm9qZWN0cyBpcyBub3QgbG9hZGVkIG9uIHRoaXMgcGFnZVxufSIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmcgdGhlIGh1Z2UgYW1vdXQgb2YgaW1hZ2VzIG9mIGFcbiAqIHRyYW5zZWN0IG9uIGEgc2luZ2UgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFRyYW5zZWN0SW1hZ2UsICRhdHRycywgJGVsZW1lbnQsICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG11Y2ggaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXQgXG5cdFx0Ly8gd2hpY2ggYSBuZXcgYnVuY2ggb2YgaW1hZ2VzIHNob3VsZCBiZSBkaXNwbGF5ZWRcblx0XHR2YXIgbmV3U3RlcE9mZnNldCA9IDEwMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGJvdW5kaW5nUmVjdC5ib3R0b20gPD0gd2luZG93LmlubmVySGVpZ2h0ICsgbmV3U3RlcE9mZnNldDtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrTG93ZXJCb3VuZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHQkc2NvcGUubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIGlkcyBvZiB0aGlzIHRyYW5zZWN0XG5cdFx0JHNjb3BlLmltYWdlcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAkYXR0cnMudHJhbnNlY3RJZH0pO1xuXHRcdC8vIHVybCBwcmVmaXggZm9yIHRoZSBpbWFnZSBpbmRleCBwYWdlXG5cdFx0JHNjb3BlLmltYWdlVXJsID0gJGF0dHJzLmltYWdlVXJsO1xuXHRcdC8vIHVybCBwcmVmaXggZm9yIHRoZSBpbWFnZSBhcGkgZW5kcG9pbnRcblx0XHQkc2NvcGUuYXBpVXJsID0gJGF0dHJzLmFwaVVybDtcblx0XHQvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuXHRcdCRzY29wZS5saW1pdCA9IDIwO1xuXG5cdFx0aW5pdGlhbGl6ZSgpO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGF6eUltZ1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQW4gaW1hZ2UgZWxlbWVudCB0aGF0IGxvYWRzIGFuZCBzaG93cyB0aGUgaW1hZ2Ugb25seSBpZiBpdCBpcyBcbiAqIHZpc2libGUgYW5kIGhpZGVzIGl0IGFnYWluIHdoZW4gaXQgaXMgaGlkZGVuIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmRpcmVjdGl2ZSgnbGF6eUltZycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzKSB7XG5cdFx0XHRcdHZhciByZWN0LCBpc1Zpc2libGUsIHNldFNyYywgY2hlY2s7XG5cdFx0XHRcdHZhciBlbG0gPSAkZWxlbWVudFswXTtcblxuXHRcdFx0XHRpc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmVjdCA9IGVsbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0XHRyZXR1cm4gcmVjdC5ib3R0b20gPj0gMCAmJiByZWN0LnRvcCA8PSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0c2V0U3JjID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVjayk7XG5cdFx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrKTtcblx0XHRcdFx0XHQkc2NvcGUuc3JjID0gJGF0dHJzLmxhenlJbWc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y2hlY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKGlzVmlzaWJsZSgpKSAkc2NvcGUuJGFwcGx5KHNldFNyYyk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGluaXRpYWwgY2hlY2tcblx0XHRcdFx0aWYgKGlzVmlzaWJsZSgpKSBzZXRTcmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9