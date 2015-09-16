/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api']);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', ["$scope", "TransectImage", "$attrs", "$element", "$timeout", "$q", function ($scope, TransectImage, $attrs, $element, $timeout, $q) {
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
		$scope.images = TransectImage.query({transect_id: $attrs.transectId});
		// number of currently shown images
		$scope.limit = 20;

		$timeout(initialize);
	}]
);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQTs7Ozs7Ozs7OztBQ0lBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxlQUFBLFFBQUEsVUFBQSxVQUFBLElBQUE7RUFDQTs7RUFFQSxJQUFBLFVBQUEsU0FBQTtFQUNBLElBQUEsY0FBQTs7RUFFQSxJQUFBLE9BQUE7OztFQUdBLElBQUEsZ0JBQUE7O1FBRUEsSUFBQSxzQkFBQTs7UUFFQSxJQUFBLFlBQUE7O1FBRUEsSUFBQSxtQkFBQTs7RUFFQSxJQUFBLGVBQUEsWUFBQTtHQUNBLGVBQUEsUUFBQTtHQUNBLE9BQUEsUUFBQSxhQUFBLFFBQUEsZUFBQSxRQUFBLGVBQUE7OztFQUdBLElBQUEsa0JBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxpQkFBQSxTQUFBLFlBQUE7VUFDQTs7SUFFQSxTQUFBLE9BQUE7SUFDQSxRQUFBLGlCQUFBLFVBQUE7SUFDQSxPQUFBLGlCQUFBLFVBQUE7Ozs7O1FBS0EsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxtQkFBQSx1QkFBQSxVQUFBLFNBQUEsR0FBQTtnQkFDQTtnQkFDQSxVQUFBLE1BQUE7Ozs7Ozs7UUFPQSxPQUFBLGVBQUEsVUFBQSxhQUFBO1lBQ0EsSUFBQSxXQUFBLEdBQUE7O1lBRUEsVUFBQSxLQUFBOztZQUVBLFlBQUEsS0FBQSxZQUFBOzs7Z0JBR0E7Z0JBQ0E7O1lBRUEsSUFBQSxxQkFBQSxHQUFBO1lBQ0EsT0FBQSxTQUFBOzs7O0VBSUEsT0FBQSxTQUFBLGNBQUEsTUFBQSxDQUFBLGFBQUEsT0FBQTs7RUFFQSxPQUFBLFFBQUE7O0VBRUEsU0FBQTs7Ozs7Ozs7Ozs7QUMzRUEsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7OztBQU1BIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgVHJhbnNlY3RJbWFnZSwgJGF0dHJzLCAkZWxlbWVudCwgJHRpbWVvdXQsICRxKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG11Y2ggaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGF0dGVtcHRzIHRvIGZpbGwgdGhlIGN1cnJlbnQgdmlld3BvcnQgd2l0aCBpbWFnZXNcblx0XHQvLyB1c2VzICR0aW1lb3V0IHRvIHdhaXQgZm9yIERPTSByZW5kZXJpbmcsIHRoZW4gY2hlY2tzIGFnYWluXG5cdFx0dmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoaW5pdGlhbGl6ZSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBpbml0aWF0ZSBsb2FkaW5nIG9mIHRoZSBuZXh0IGltYWdlIGlmIHRoZXJlIGFyZSBzdGlsbCB1bnVzZWQgcGFyYWxsZWwgY29ubmVjdGlvbnNcbiAgICAgICAgdmFyIG1heWJlTG9hZE5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudGx5TG9hZGluZyA8IHBhcmFsbGVsQ29ubmVjdGlvbnMgJiYgbG9hZFN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nKys7XG4gICAgICAgICAgICAgICAgbG9hZFN0YWNrLnBvcCgpLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBpZHMgb2YgdGhpcyB0cmFuc2VjdFxuXHRcdCRzY29wZS5pbWFnZXMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogJGF0dHJzLnRyYW5zZWN0SWR9KTtcblx0XHQvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuXHRcdCRzY29wZS5saW1pdCA9IDIwO1xuXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9