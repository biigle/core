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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZVBhZ2VCdXR0b25Db250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvSW1hZ2VzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NpZGViYXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RzQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxrQkFBQSxDQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSxrREFBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztFQUVBLElBQUEsU0FBQSxPQUFBLFdBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxJQUFBLEtBQUE7O0VBRUEsT0FBQSxXQUFBOztFQUVBLE9BQUEsV0FBQSxZQUFBO0dBQ0EsT0FBQSxhQUFBOzs7RUFHQSxPQUFBLElBQUEsb0JBQUEsVUFBQSxHQUFBLFVBQUE7R0FDQSxPQUFBLFdBQUEsT0FBQTtHQUNBLElBQUEsT0FBQSxVQUFBO0lBQ0EsT0FBQSxZQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7QUNmQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSxrRkFBQSxVQUFBLFFBQUEsZUFBQSxRQUFBLFVBQUEsVUFBQTtFQUNBOztFQUVBLElBQUEsVUFBQSxTQUFBO0VBQ0EsSUFBQSxjQUFBOztFQUVBLElBQUEsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQTs7RUFFQSxJQUFBLGVBQUEsWUFBQTtHQUNBLGVBQUEsUUFBQTtHQUNBLE9BQUEsUUFBQSxhQUFBLFFBQUEsZUFBQSxRQUFBLGVBQUE7OztFQUdBLElBQUEsa0JBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxpQkFBQSxTQUFBLFlBQUE7VUFDQTs7SUFFQSxTQUFBLE9BQUE7SUFDQSxRQUFBLGlCQUFBLFVBQUE7SUFDQSxPQUFBLGlCQUFBLFVBQUE7Ozs7O0VBS0EsT0FBQSxTQUFBLGNBQUEsTUFBQSxDQUFBLGFBQUEsT0FBQTs7RUFFQSxPQUFBLFFBQUE7O0VBRUEsU0FBQTs7Ozs7Ozs7OztBQzNDQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSxtREFBQSxVQUFBLFFBQUEsT0FBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQSxXQUFBLE9BQUEsU0FBQSxNQUFBOztFQUVBLElBQUEsbUJBQUEsVUFBQSxjQUFBLFlBQUEsU0FBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFFBQUE7O0dBRUEsV0FBQTtHQUNBLE9BQUEsWUFBQSxNQUFBLElBQUEsQ0FBQSxJQUFBOzs7RUFHQSxPQUFBLElBQUEsa0JBQUE7Ozs7Ozs7Ozs7QUNaQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSw4Q0FBQSxVQUFBLFFBQUEsVUFBQTtFQUNBOztFQUVBLElBQUEseUJBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxJQUFBLFNBQUE7O0VBRUEsT0FBQSxTQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7OztFQUdBLE9BQUEsY0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBLENBQUEsVUFBQSxDQUFBLFFBQUE7SUFDQSxPQUFBOztHQUVBLE9BQUEsU0FBQSxLQUFBOzs7RUFHQSxPQUFBLGNBQUEsVUFBQSxHQUFBLEdBQUE7R0FDQSxTQUFBO0dBQ0EsU0FBQTs7O0VBR0EsT0FBQSxnQkFBQSxVQUFBLEdBQUEsSUFBQTtHQUNBLE9BQUEsV0FBQSxrQkFBQSxHQUFBO0dBQ0EsT0FBQSxPQUFBLFFBQUE7OztFQUdBLE9BQUEsZUFBQSxVQUFBLElBQUE7R0FDQSxJQUFBLE9BQUEsT0FBQSxVQUFBLElBQUE7SUFDQSxLQUFBOztHQUVBLE9BQUEsT0FBQSxTQUFBO0dBQ0EsT0FBQSxXQUFBLG9CQUFBO0dBQ0EsT0FBQSxhQUFBLFFBQUEsd0JBQUE7Ozs7OztFQU1BLFNBQUEsWUFBQTtHQUNBLElBQUEsS0FBQSxPQUFBLGFBQUEsUUFBQTtHQUNBLE9BQUEsYUFBQSxPQUFBLE9BQUEsc0JBQUE7OztFQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VQYWdlQnV0dG9uQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbHMgdGhlIGJ1dHRvbiBmb3IgZ29pbmcgdG8gdGhlIGltYWdlIGluZGV4IHBhZ2Ugd2hlbiBjbGlja2luZyBvbiBhbiBpbWFnZSBvZiB0aGUgdHJhbnNlY3RzIHZpZXcuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlUGFnZUJ1dHRvbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBwcmVmaXggPSAkYXR0cnMuaW1hZ2VVcmwgKyAnLyc7XG5cdFx0dmFyIHN1ZmZpeCA9ICcnO1xuXHRcdHZhciBpZCA9ICdpbWFnZS1wYWdlLWJ1dHRvbic7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS50b2dnbGVCdXR0b24oaWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdidXR0b24uc2V0QWN0aXZlJywgZnVuY3Rpb24gKGUsIGJ1dHRvbklkKSB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBpZCA9PT0gYnV0dG9uSWQ7XG5cdFx0XHRpZiAoJHNjb3BlLnNlbGVjdGVkKSB7XG5cdFx0XHRcdCRzY29wZS5zZXRJbWFnZVVybChwcmVmaXgsIHN1ZmZpeCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgVHJhbnNlY3RJbWFnZSwgJGF0dHJzLCAkZWxlbWVudCwgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbXVjaCBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdCBcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHQkc2NvcGUubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIGlkcyBvZiB0aGlzIHRyYW5zZWN0XG5cdFx0JHNjb3BlLmltYWdlcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAkYXR0cnMudHJhbnNlY3RJZH0pO1xuXHRcdC8vIG51bWJlciBvZiBjdXJyZW50bHkgc2hvd24gaW1hZ2VzXG5cdFx0JHNjb3BlLmxpbWl0ID0gMjA7XG5cblx0XHQkdGltZW91dChpbml0aWFsaXplKTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgb2YgdGhlIHRyYW5zZWN0cyBpbmRleCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdTaWRlYmFyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEltYWdlLCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5leGlmS2V5cyA9ICRhdHRycy5leGlmS2V5cy5zcGxpdCgnLCcpO1xuXG5cdFx0dmFyIGhhbmRsZUltYWdlQ2xpY2sgPSBmdW5jdGlvbiAoYW5ndWxhckV2ZW50LCBjbGlja0V2ZW50LCBpbWFnZUlkKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmFjdGl2ZS5idXR0b24pIHJldHVybjtcblxuXHRcdFx0Y2xpY2tFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0JHNjb3BlLmltYWdlRGF0YSA9IEltYWdlLmdldCh7aWQ6IGltYWdlSWR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2VsZWN0ZWQnLCBoYW5kbGVJbWFnZUNsaWNrKTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBtYW5hZ2luZyB0aGUgdHJhbnNlY3RzIGluZGV4IHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGFjdGl2ZUJ1dHRvblN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuaW5kZXguYWN0aXZlLmJ1dHRvbic7XG5cdFx0dmFyIHByZWZpeCA9ICcnO1xuXHRcdHZhciBzdWZmaXggPSAnJztcblxuXHRcdCRzY29wZS5hY3RpdmUgPSB7XG5cdFx0XHRpbWFnZTogJycsXG5cdFx0XHRidXR0b246ICcnXG5cdFx0fTtcblxuXHRcdCRzY29wZS5nZXRJbWFnZVVybCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWYgKCFwcmVmaXggJiYgIXN1ZmZpeCkge1xuXHRcdFx0XHRyZXR1cm4gJyMnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByZWZpeCArIGlkICsgc3VmZml4O1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2V0SW1hZ2VVcmwgPSBmdW5jdGlvbiAocCwgcykge1xuXHRcdFx0cHJlZml4ID0gcDtcblx0XHRcdHN1ZmZpeCA9IHM7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pbWFnZVNlbGVjdGVkID0gZnVuY3Rpb24gKGUsIGlkKSB7XG5cdFx0XHQkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2VsZWN0ZWQnLCBlLCBpZCk7XG5cdFx0XHQkc2NvcGUuYWN0aXZlLmltYWdlID0gaWQ7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVCdXR0b24gPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlmICgkc2NvcGUuYWN0aXZlLmJ1dHRvbiA9PSBpZCkge1xuXHRcdFx0XHRpZCA9ICcnO1xuXHRcdFx0fVxuXHRcdFx0JHNjb3BlLmFjdGl2ZS5idXR0b24gPSBpZDtcblx0XHRcdCRzY29wZS4kYnJvYWRjYXN0KCdidXR0b24uc2V0QWN0aXZlJywgaWQpO1xuXHRcdFx0d2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGFjdGl2ZUJ1dHRvblN0b3JhZ2VLZXksIGlkKTtcblx0XHR9O1xuXG5cdFx0Ly8gZGVmYXVsdCBhY3RpdmUgYnV0dG9uIGlzIGltYWdlIHBhZ2UgYnV0dG9uIGlmIG5vbmUgd2FzIHNldCBpbiBcblx0XHQvLyBsb2NhbFN0b3JhZ2Vcblx0XHQvLyAkc2NvcGUudG9nZ2xlQnV0dG9uKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShhY3RpdmVCdXR0b25TdG9yYWdlS2V5KSB8fFx0J2ltYWdlLXBhZ2UtYnV0dG9uJyk7XG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGlkID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGFjdGl2ZUJ1dHRvblN0b3JhZ2VLZXkpO1xuXHRcdFx0JHNjb3BlLnRvZ2dsZUJ1dHRvbihpZCA9PT0gbnVsbCA/ICdpbWFnZS1wYWdlLWJ1dHRvbicgOiBpZCk7XG5cdFx0fSk7XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9