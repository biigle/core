/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api']);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagePageButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image index page when clicking on an image of the transects view.
 */
angular.module('dias.transects').controller('ImagePageButtonController', ["$scope", "$attrs", function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.imageUrl + '/';
		var suffix = '';
		var id = 'image-page-button';

		$scope.selected = false;

		$scope.activate = function () {
			$scope.toggleButton(id);
		};

		$scope.$on('button.setActive', function (e, buttonId) {
			$scope.selected = id === buttonId;
			if ($scope.selected) {
				$scope.setImageUrl(prefix, suffix);
			}
		});
	}]
);
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
			return element.scrollTop >= element.scrollHeight - element.offsetHeight - newStepOffset;
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
				element.addEventListener('scroll', checkLowerBound);
				window.addEventListener('resize', checkLowerBound);
			}
		};

		// array of all image ids of this transect
		$scope.images = TransectImage.query({transect_id: $attrs.transectId});
		// number of currently shown images
		$scope.limit = 20;

		$timeout(initialize);
	}]
);
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.transects
 * @description Controller for the sidebar of the transects index page.
 */
angular.module('dias.transects').controller('SidebarController', ["$scope", "Image", "$attrs", function ($scope, Image, $attrs) {
		"use strict";

		$scope.exifKeys = $attrs.exifKeys.split(',');

		var handleImageClick = function (angularEvent, clickEvent, imageId) {
			if ($scope.active.button) return;

			clickEvent.preventDefault();
			$scope.imageData = Image.get({id: imageId});
		};

		$scope.$on('image.selected', handleImageClick);
	}]
);
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectsController
 * @memberOf dias.transects
 * @description Controller for managing the transects index page.
 */
angular.module('dias.transects').controller('TransectsController', ["$scope", "$timeout", function ($scope, $timeout) {
		"use strict";

		var activeButtonStorageKey = 'dias.transects.index.active.button';
		var prefix = '';
		var suffix = '';

		$scope.active = {
			image: '',
			button: ''
		};

		$scope.getImageUrl = function (id) {
			if (!prefix && !suffix) {
				return '#';
			}
			return prefix + id + suffix;
		};

		$scope.setImageUrl = function (p, s) {
			prefix = p;
			suffix = s;
		};

		$scope.imageSelected = function (e, id) {
			$scope.$broadcast('image.selected', e, id);
			$scope.active.image = id;
		};

		$scope.toggleButton = function (id) {
			if ($scope.active.button == id) {
				id = '';
			}
			$scope.active.button = id;
			$scope.$broadcast('button.setActive', id);
			window.localStorage.setItem(activeButtonStorageKey, id);
		};

		// default active button is image page button if none was set in 
		// localStorage
		// $scope.toggleButton(window.localStorage.getItem(activeButtonStorageKey) ||	'image-page-button');
		$timeout(function () {
			var id = window.localStorage.getItem(activeButtonStorageKey);
			$scope.toggleButton(id === null ? 'image-page-button' : id);
		});
	}]
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYW5zZWN0cy9tYWluLmpzIiwidHJhbnNlY3RzL2NvbnRyb2xsZXJzL0ltYWdlUGFnZUJ1dHRvbkNvbnRyb2xsZXIuanMiLCJ0cmFuc2VjdHMvY29udHJvbGxlcnMvSW1hZ2VzQ29udHJvbGxlci5qcyIsInRyYW5zZWN0cy9jb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsInRyYW5zZWN0cy9jb250cm9sbGVycy9UcmFuc2VjdHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUE7Ozs7Ozs7OztBQ0dBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLGtEQUFBLFVBQUEsUUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxTQUFBLE9BQUEsV0FBQTtFQUNBLElBQUEsU0FBQTtFQUNBLElBQUEsS0FBQTs7RUFFQSxPQUFBLFdBQUE7O0VBRUEsT0FBQSxXQUFBLFlBQUE7R0FDQSxPQUFBLGFBQUE7OztFQUdBLE9BQUEsSUFBQSxvQkFBQSxVQUFBLEdBQUEsVUFBQTtHQUNBLE9BQUEsV0FBQSxPQUFBO0dBQ0EsSUFBQSxPQUFBLFVBQUE7SUFDQSxPQUFBLFlBQUEsUUFBQTs7Ozs7Ozs7Ozs7OztBQ2ZBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLGtGQUFBLFVBQUEsUUFBQSxlQUFBLFFBQUEsVUFBQSxVQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztFQUVBLElBQUEsZUFBQSxZQUFBO0dBQ0EsZUFBQSxRQUFBO0dBQ0EsT0FBQSxRQUFBLGFBQUEsUUFBQSxlQUFBLFFBQUEsZUFBQTs7O0VBR0EsSUFBQSxrQkFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsU0FBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7RUFLQSxPQUFBLFNBQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxPQUFBOztFQUVBLE9BQUEsUUFBQTs7RUFFQSxTQUFBOzs7Ozs7Ozs7O0FDM0NBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLG1EQUFBLFVBQUEsUUFBQSxPQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLFdBQUEsT0FBQSxTQUFBLE1BQUE7O0VBRUEsSUFBQSxtQkFBQSxVQUFBLGNBQUEsWUFBQSxTQUFBO0dBQ0EsSUFBQSxPQUFBLE9BQUEsUUFBQTs7R0FFQSxXQUFBO0dBQ0EsT0FBQSxZQUFBLE1BQUEsSUFBQSxDQUFBLElBQUE7OztFQUdBLE9BQUEsSUFBQSxrQkFBQTs7Ozs7Ozs7OztBQ1pBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLDhDQUFBLFVBQUEsUUFBQSxVQUFBO0VBQ0E7O0VBRUEsSUFBQSx5QkFBQTtFQUNBLElBQUEsU0FBQTtFQUNBLElBQUEsU0FBQTs7RUFFQSxPQUFBLFNBQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTs7O0VBR0EsT0FBQSxjQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxVQUFBLENBQUEsUUFBQTtJQUNBLE9BQUE7O0dBRUEsT0FBQSxTQUFBLEtBQUE7OztFQUdBLE9BQUEsY0FBQSxVQUFBLEdBQUEsR0FBQTtHQUNBLFNBQUE7R0FDQSxTQUFBOzs7RUFHQSxPQUFBLGdCQUFBLFVBQUEsR0FBQSxJQUFBO0dBQ0EsT0FBQSxXQUFBLGtCQUFBLEdBQUE7R0FDQSxPQUFBLE9BQUEsUUFBQTs7O0VBR0EsT0FBQSxlQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFVBQUEsSUFBQTtJQUNBLEtBQUE7O0dBRUEsT0FBQSxPQUFBLFNBQUE7R0FDQSxPQUFBLFdBQUEsb0JBQUE7R0FDQSxPQUFBLGFBQUEsUUFBQSx3QkFBQTs7Ozs7O0VBTUEsU0FBQSxZQUFBO0dBQ0EsSUFBQSxLQUFBLE9BQUEsYUFBQSxRQUFBO0dBQ0EsT0FBQSxhQUFBLE9BQUEsT0FBQSxzQkFBQTs7O0VBR0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZVBhZ2VCdXR0b25Db250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9scyB0aGUgYnV0dG9uIGZvciBnb2luZyB0byB0aGUgaW1hZ2UgaW5kZXggcGFnZSB3aGVuIGNsaWNraW5nIG9uIGFuIGltYWdlIG9mIHRoZSB0cmFuc2VjdHMgdmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VQYWdlQnV0dG9uQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHByZWZpeCA9ICRhdHRycy5pbWFnZVVybCArICcvJztcblx0XHR2YXIgc3VmZml4ID0gJyc7XG5cdFx0dmFyIGlkID0gJ2ltYWdlLXBhZ2UtYnV0dG9uJztcblxuXHRcdCRzY29wZS5zZWxlY3RlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLnRvZ2dsZUJ1dHRvbihpZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ2J1dHRvbi5zZXRBY3RpdmUnLCBmdW5jdGlvbiAoZSwgYnV0dG9uSWQpIHtcblx0XHRcdCRzY29wZS5zZWxlY3RlZCA9IGlkID09PSBidXR0b25JZDtcblx0XHRcdGlmICgkc2NvcGUuc2VsZWN0ZWQpIHtcblx0XHRcdFx0JHNjb3BlLnNldEltYWdlVXJsKHByZWZpeCwgc3VmZml4KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBkaXNwbGF5aW5nIHRoZSBodWdlIGFtb3V0IG9mIGltYWdlcyBvZiBhXG4gKiB0cmFuc2VjdCBvbiBhIHNpbmdlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBUcmFuc2VjdEltYWdlLCAkYXR0cnMsICRlbGVtZW50LCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSAkZWxlbWVudFswXTtcblx0XHR2YXIgYm91bmRpbmdSZWN0LCB0aW1lb3V0UHJvbWlzZTtcblx0XHQvLyBhZGQgdGhpcyBtdWNoIGltYWdlcyBmb3IgZWFjaCBzdGVwXG5cdFx0dmFyIHN0ZXAgPSAyMDtcblx0XHQvLyBvZmZzZXQgb2YgdGhlIGVsZW1lbnQgYm90dG9tIHRvIHRoZSB3aW5kb3cgbG93ZXIgYm91bmQgaW4gcGl4ZWxzIGF0IFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG5cblx0XHR2YXIgbmVlZHNOZXdTdGVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ym91bmRpbmdSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdHJldHVybiBlbGVtZW50LnNjcm9sbFRvcCA+PSBlbGVtZW50LnNjcm9sbEhlaWdodCAtIGVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gbmV3U3RlcE9mZnNldDtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrTG93ZXJCb3VuZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHQkc2NvcGUubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhcnJheSBvZiBhbGwgaW1hZ2UgaWRzIG9mIHRoaXMgdHJhbnNlY3Rcblx0XHQkc2NvcGUuaW1hZ2VzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6ICRhdHRycy50cmFuc2VjdElkfSk7XG5cdFx0Ly8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcblx0XHQkc2NvcGUubGltaXQgPSAyMDtcblxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBvZiB0aGUgdHJhbnNlY3RzIGluZGV4IHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgSW1hZ2UsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmV4aWZLZXlzID0gJGF0dHJzLmV4aWZLZXlzLnNwbGl0KCcsJyk7XG5cblx0XHR2YXIgaGFuZGxlSW1hZ2VDbGljayA9IGZ1bmN0aW9uIChhbmd1bGFyRXZlbnQsIGNsaWNrRXZlbnQsIGltYWdlSWQpIHtcblx0XHRcdGlmICgkc2NvcGUuYWN0aXZlLmJ1dHRvbikgcmV0dXJuO1xuXG5cdFx0XHRjbGlja0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHQkc2NvcGUuaW1hZ2VEYXRhID0gSW1hZ2UuZ2V0KHtpZDogaW1hZ2VJZH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zZWxlY3RlZCcsIGhhbmRsZUltYWdlQ2xpY2spO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFRyYW5zZWN0c0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIG1hbmFnaW5nIHRoZSB0cmFuc2VjdHMgaW5kZXggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYWN0aXZlQnV0dG9uU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy5pbmRleC5hY3RpdmUuYnV0dG9uJztcblx0XHR2YXIgcHJlZml4ID0gJyc7XG5cdFx0dmFyIHN1ZmZpeCA9ICcnO1xuXG5cdFx0JHNjb3BlLmFjdGl2ZSA9IHtcblx0XHRcdGltYWdlOiAnJyxcblx0XHRcdGJ1dHRvbjogJydcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmdldEltYWdlVXJsID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZiAoIXByZWZpeCAmJiAhc3VmZml4KSB7XG5cdFx0XHRcdHJldHVybiAnIyc7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcHJlZml4ICsgaWQgKyBzdWZmaXg7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zZXRJbWFnZVVybCA9IGZ1bmN0aW9uIChwLCBzKSB7XG5cdFx0XHRwcmVmaXggPSBwO1xuXHRcdFx0c3VmZml4ID0gcztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmltYWdlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZSwgaWQpIHtcblx0XHRcdCRzY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5zZWxlY3RlZCcsIGUsIGlkKTtcblx0XHRcdCRzY29wZS5hY3RpdmUuaW1hZ2UgPSBpZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUJ1dHRvbiA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWYgKCRzY29wZS5hY3RpdmUuYnV0dG9uID09IGlkKSB7XG5cdFx0XHRcdGlkID0gJyc7XG5cdFx0XHR9XG5cdFx0XHQkc2NvcGUuYWN0aXZlLmJ1dHRvbiA9IGlkO1xuXHRcdFx0JHNjb3BlLiRicm9hZGNhc3QoJ2J1dHRvbi5zZXRBY3RpdmUnLCBpZCk7XG5cdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oYWN0aXZlQnV0dG9uU3RvcmFnZUtleSwgaWQpO1xuXHRcdH07XG5cblx0XHQvLyBkZWZhdWx0IGFjdGl2ZSBidXR0b24gaXMgaW1hZ2UgcGFnZSBidXR0b24gaWYgbm9uZSB3YXMgc2V0IGluIFxuXHRcdC8vIGxvY2FsU3RvcmFnZVxuXHRcdC8vICRzY29wZS50b2dnbGVCdXR0b24od2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGFjdGl2ZUJ1dHRvblN0b3JhZ2VLZXkpIHx8XHQnaW1hZ2UtcGFnZS1idXR0b24nKTtcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgaWQgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oYWN0aXZlQnV0dG9uU3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUudG9nZ2xlQnV0dG9uKGlkID09PSBudWxsID8gJ2ltYWdlLXBhZ2UtYnV0dG9uJyA6IGlkKTtcblx0XHR9KTtcblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=