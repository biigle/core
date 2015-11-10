/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name lazyImage
 * @memberOf dias.transects
 * @description A lazy loading image
 */
angular.module('dias.transects').directive('lazyImage', ["$q", function ($q) {
        "use strict";

        return {
            restrict: 'A',

            link: function (scope, element, attrs) {
                // promise that is resolved when the image was loaded
                var deferred = $q.defer();
                scope.enqueueImage(deferred.promise).then(function () {
                    element.bind('load error', deferred.resolve);
                    attrs.$set('src', attrs.lazyImage);
                });
            }
        };
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
angular.module('dias.transects').controller('ImagesController', ["$scope", "TransectImage", "$element", "$timeout", "$q", function ($scope, TransectImage, $element, $timeout, $q) {
		"use strict";

		var element = $element[0];
		var boundingRect, timeoutPromise;
		// add this much images for each step
		var step = 20;
		// offset of the element bottom to the window lower bound in pixels at
		// which a new bunch of images should be displayed
		var newStepOffset = 100;
        // number of images that are allowed to load in parallel
        var parallelConnections = 10;
        // stores the promises of the images that want to load
        var loadStack = [];
        // number of images that are currently loading
        var currentlyLoading = 0;

		var needsNewStep = function () {
			boundingRect = element.getBoundingClientRect();
			return element.scrollTop >= element.scrollHeight - element.offsetHeight - newStepOffset;
		};

		var checkLowerBound = function () {
			if (needsNewStep()) {
				$scope.info.limit += step;
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				$scope.info.limit += step;
				timeoutPromise = $timeout(initialize, 500);
			} else {
				// viewport is full, now switch to event listeners for loading
				$timeout.cancel(timeoutPromise);
				element.addEventListener('scroll', checkLowerBound);
				window.addEventListener('resize', checkLowerBound);
			}
		};

        // initiate loading of the next image if there are still unused parallel connections
        var maybeLoadNext = function () {
            while (currentlyLoading < parallelConnections && loadStack.length > 0) {
                currentlyLoading++;
                loadStack.pop().resolve();
            }
            // console.log(loadStack.length);
        };

        // returns a promise that gets resolved when the image should load
        // gets a promise as argiment that is resolved when the image was loaded
        $scope.enqueueImage = function (imageLoaded) {
            var deferred = $q.defer();
            // add the "should load" promise to the stack
            loadStack.push(deferred);
            // console.log('enqueued', loadStack.length);
            imageLoaded.then(function () {
                // console.log('loaded', loadStack.length);
                // load the next image in the stack
                currentlyLoading--;
                maybeLoadNext();
            });
            if (currentlyLoading === 0) maybeLoadNext();
            return deferred.promise;
        };

		// array of all image ids of this transect
		$scope.images = TransectImage.query({transect_id: $scope.transectId}, function () {
            $scope.info.numberOfImages = $scope.images.length;
        });

		$timeout(initialize);
	}]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', ["$scope", "$attrs", function ($scope, $attrs) {
		"use strict";

        $scope.transectId = $attrs.transectId;

        $scope.info = {
            // number of overall images
            numberOfImages: undefined,
            // number of currently shown images
            limit: 20
        };

        $scope.progress = function () {
            return {
                width: ($scope.info.numberOfImages ? Math.min($scope.info.limit / $scope.info.numberOfImages, 1) * 100 : 0) + '%'
            };
        };
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2xhenlJbWFnZS5qcyIsImNvbnRyb2xsZXJzL0ltYWdlc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9UcmFuc2VjdENvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsa0JBQUEsVUFBQSxvQkFBQSxVQUFBLElBQUE7UUFDQTs7UUFFQSxPQUFBO1lBQ0EsVUFBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7O2dCQUVBLElBQUEsV0FBQSxHQUFBO2dCQUNBLE1BQUEsYUFBQSxTQUFBLFNBQUEsS0FBQSxZQUFBO29CQUNBLFFBQUEsS0FBQSxjQUFBLFNBQUE7b0JBQ0EsTUFBQSxLQUFBLE9BQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FDVkEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLGVBQUEsVUFBQSxVQUFBLElBQUE7RUFDQTs7RUFFQSxJQUFBLFVBQUEsU0FBQTtFQUNBLElBQUEsY0FBQTs7RUFFQSxJQUFBLE9BQUE7OztFQUdBLElBQUEsZ0JBQUE7O1FBRUEsSUFBQSxzQkFBQTs7UUFFQSxJQUFBLFlBQUE7O1FBRUEsSUFBQSxtQkFBQTs7RUFFQSxJQUFBLGVBQUEsWUFBQTtHQUNBLGVBQUEsUUFBQTtHQUNBLE9BQUEsUUFBQSxhQUFBLFFBQUEsZUFBQSxRQUFBLGVBQUE7OztFQUdBLElBQUEsa0JBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLEtBQUEsU0FBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsS0FBQSxTQUFBO0lBQ0EsaUJBQUEsU0FBQSxZQUFBO1VBQ0E7O0lBRUEsU0FBQSxPQUFBO0lBQ0EsUUFBQSxpQkFBQSxVQUFBO0lBQ0EsT0FBQSxpQkFBQSxVQUFBOzs7OztRQUtBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsbUJBQUEsdUJBQUEsVUFBQSxTQUFBLEdBQUE7Z0JBQ0E7Z0JBQ0EsVUFBQSxNQUFBOzs7Ozs7O1FBT0EsT0FBQSxlQUFBLFVBQUEsYUFBQTtZQUNBLElBQUEsV0FBQSxHQUFBOztZQUVBLFVBQUEsS0FBQTs7WUFFQSxZQUFBLEtBQUEsWUFBQTs7O2dCQUdBO2dCQUNBOztZQUVBLElBQUEscUJBQUEsR0FBQTtZQUNBLE9BQUEsU0FBQTs7OztFQUlBLE9BQUEsU0FBQSxjQUFBLE1BQUEsQ0FBQSxhQUFBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQSxLQUFBLGlCQUFBLE9BQUEsT0FBQTs7O0VBR0EsU0FBQTs7Ozs7Ozs7Ozs7QUMzRUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsMkNBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7UUFFQSxPQUFBLGFBQUEsT0FBQTs7UUFFQSxPQUFBLE9BQUE7O1lBRUEsZ0JBQUE7O1lBRUEsT0FBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBO2dCQUNBLE9BQUEsQ0FBQSxPQUFBLEtBQUEsaUJBQUEsS0FBQSxJQUFBLE9BQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxnQkFBQSxLQUFBLE1BQUEsS0FBQTs7Ozs7QUFLQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYXp5SW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgbGF6eSBsb2FkaW5nIGltYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmRpcmVjdGl2ZSgnbGF6eUltYWdlJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHNjb3BlLmVucXVldWVJbWFnZShkZWZlcnJlZC5wcm9taXNlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdsb2FkIGVycm9yJywgZGVmZXJyZWQucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLiRzZXQoJ3NyYycsIGF0dHJzLmxhenlJbWFnZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmcgdGhlIGh1Z2UgYW1vdXQgb2YgaW1hZ2VzIG9mIGFcbiAqIHRyYW5zZWN0IG9uIGEgc2luZ2UgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFRyYW5zZWN0SW1hZ2UsICRlbGVtZW50LCAkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbXVjaCBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmluZm8ubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5pbmZvLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoaW5pdGlhbGl6ZSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBpbml0aWF0ZSBsb2FkaW5nIG9mIHRoZSBuZXh0IGltYWdlIGlmIHRoZXJlIGFyZSBzdGlsbCB1bnVzZWQgcGFyYWxsZWwgY29ubmVjdGlvbnNcbiAgICAgICAgdmFyIG1heWJlTG9hZE5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudGx5TG9hZGluZyA8IHBhcmFsbGVsQ29ubmVjdGlvbnMgJiYgbG9hZFN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nKys7XG4gICAgICAgICAgICAgICAgbG9hZFN0YWNrLnBvcCgpLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBpZHMgb2YgdGhpcyB0cmFuc2VjdFxuXHRcdCRzY29wZS5pbWFnZXMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogJHNjb3BlLnRyYW5zZWN0SWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW5mby5udW1iZXJPZkltYWdlcyA9ICRzY29wZS5pbWFnZXMubGVuZ3RoO1xuICAgICAgICB9KTtcblxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS50cmFuc2VjdElkID0gJGF0dHJzLnRyYW5zZWN0SWQ7XG5cbiAgICAgICAgJHNjb3BlLmluZm8gPSB7XG4gICAgICAgICAgICAvLyBudW1iZXIgb2Ygb3ZlcmFsbCBpbWFnZXNcbiAgICAgICAgICAgIG51bWJlck9mSW1hZ2VzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICAgICAgbGltaXQ6IDIwXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogKCRzY29wZS5pbmZvLm51bWJlck9mSW1hZ2VzID8gTWF0aC5taW4oJHNjb3BlLmluZm8ubGltaXQgLyAkc2NvcGUuaW5mby5udW1iZXJPZkltYWdlcywgMSkgKiAxMDAgOiAwKSArICclJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==