/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', ["$scope", "$element", "$timeout", "$q", function ($scope, $element, $timeout, $q) {
		"use strict";

		var element = $element[0];
		var boundingRect, timeoutPromise;
		// add this many images for each step
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
				$scope.images.limit += step;
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				$scope.images.limit += step;
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

		$timeout(initialize);
        $scope.$on('transects.images.new-sequence', initialize);
	}]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', ["$scope", "$attrs", "TransectImage", function ($scope, $attrs, TransectImage) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        $scope.transectId = $attrs.transectId;

        $scope.images = {
            // all image IDs of the transect in arbirtary ordering
            ids: [],
            // the currently displayed ordering of images (as array of image IDs)
            sequence: [],
            // number of currently shown images
            limit: initialLimit,
            // number of overall images
            length: undefined
        };

        $scope.progress = function () {
            return {
                width: ($scope.images.length ? Math.min($scope.images.limit / $scope.images.length, 1) * 100 : 0) + '%'
            };
        };

        $scope.setImagesSequence = function (sequence) {
            // if sequence is null, reset
            $scope.images.sequence = sequence || $scope.images.ids;
            // reset limit
            $scope.images.limit = initialLimit;
            $scope.$broadcast('transects.images.new-sequence');
        };

        // array of all image ids of this transect
        $scope.images.ids = TransectImage.query({transect_id: $scope.transectId}, function (ids) {
            $scope.images.length = ids.length;
            $scope.images.sequence = ids;
        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO0lBQ0EsT0FBQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFBLFlBQUE7OztnQkFHQTtnQkFDQTs7WUFFQSxJQUFBLHFCQUFBLEdBQUE7WUFDQSxPQUFBLFNBQUE7OztFQUdBLFNBQUE7UUFDQSxPQUFBLElBQUEsaUNBQUE7Ozs7Ozs7Ozs7O0FDdkVBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLDREQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUE7RUFDQTs7O1FBR0EsSUFBQSxlQUFBOztRQUVBLE9BQUEsYUFBQSxPQUFBOztRQUVBLE9BQUEsU0FBQTs7WUFFQSxLQUFBOztZQUVBLFVBQUE7O1lBRUEsT0FBQTs7WUFFQSxRQUFBOzs7UUFHQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQSxDQUFBLE9BQUEsT0FBQSxTQUFBLEtBQUEsSUFBQSxPQUFBLE9BQUEsUUFBQSxPQUFBLE9BQUEsUUFBQSxLQUFBLE1BQUEsS0FBQTs7OztRQUlBLE9BQUEsb0JBQUEsVUFBQSxVQUFBOztZQUVBLE9BQUEsT0FBQSxXQUFBLFlBQUEsT0FBQSxPQUFBOztZQUVBLE9BQUEsT0FBQSxRQUFBO1lBQ0EsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxPQUFBLE1BQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxPQUFBLGFBQUEsVUFBQSxLQUFBO1lBQ0EsT0FBQSxPQUFBLFNBQUEsSUFBQTtZQUNBLE9BQUEsT0FBQSxXQUFBOzs7Ozs7Ozs7Ozs7QUNwQ0EsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7OztBQU1BIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBkaXNwbGF5aW5nIHRoZSBodWdlIGFtb3V0IG9mIGltYWdlcyBvZiBhXG4gKiB0cmFuc2VjdCBvbiBhIHNpbmdlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJHRpbWVvdXQsICRxKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5pbWFnZXMubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5pbWFnZXMubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHNob3VsZCBsb2FkXG4gICAgICAgIC8vIGdldHMgYSBwcm9taXNlIGFzIGFyZ2ltZW50IHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAkc2NvcGUuZW5xdWV1ZUltYWdlID0gZnVuY3Rpb24gKGltYWdlTG9hZGVkKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgLy8gYWRkIHRoZSBcInNob3VsZCBsb2FkXCIgcHJvbWlzZSB0byB0aGUgc3RhY2tcbiAgICAgICAgICAgIGxvYWRTdGFjay5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlbnF1ZXVlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgaW1hZ2VMb2FkZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xvYWRlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIGxvYWQgdGhlIG5leHQgaW1hZ2UgaW4gdGhlIHN0YWNrXG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZy0tO1xuICAgICAgICAgICAgICAgIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUxvYWRpbmcgPT09IDApIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9O1xuXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LXNlcXVlbmNlJywgaW5pdGlhbGl6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzLCBUcmFuc2VjdEltYWdlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGluaXRpYWxseSBzaG93biBpbWFnZXNcbiAgICAgICAgdmFyIGluaXRpYWxMaW1pdCA9IDIwO1xuXG4gICAgICAgICRzY29wZS50cmFuc2VjdElkID0gJGF0dHJzLnRyYW5zZWN0SWQ7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IHtcbiAgICAgICAgICAgIC8vIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0IGluIGFyYmlydGFyeSBvcmRlcmluZ1xuICAgICAgICAgICAgaWRzOiBbXSxcbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50bHkgZGlzcGxheWVkIG9yZGVyaW5nIG9mIGltYWdlcyAoYXMgYXJyYXkgb2YgaW1hZ2UgSURzKVxuICAgICAgICAgICAgc2VxdWVuY2U6IFtdLFxuICAgICAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgICAgIGxpbWl0OiBpbml0aWFsTGltaXQsXG4gICAgICAgICAgICAvLyBudW1iZXIgb2Ygb3ZlcmFsbCBpbWFnZXNcbiAgICAgICAgICAgIGxlbmd0aDogdW5kZWZpbmVkXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogKCRzY29wZS5pbWFnZXMubGVuZ3RoID8gTWF0aC5taW4oJHNjb3BlLmltYWdlcy5saW1pdCAvICRzY29wZS5pbWFnZXMubGVuZ3RoLCAxKSAqIDEwMCA6IDApICsgJyUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXF1ZW5jZSkge1xuICAgICAgICAgICAgLy8gaWYgc2VxdWVuY2UgaXMgbnVsbCwgcmVzZXRcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSBzZXF1ZW5jZSB8fCAkc2NvcGUuaW1hZ2VzLmlkcztcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LXNlcXVlbmNlJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYXJyYXkgb2YgYWxsIGltYWdlIGlkcyBvZiB0aGlzIHRyYW5zZWN0XG4gICAgICAgICRzY29wZS5pbWFnZXMuaWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6ICRzY29wZS50cmFuc2VjdElkfSwgZnVuY3Rpb24gKGlkcykge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5sZW5ndGggPSBpZHMubGVuZ3RoO1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IGlkcztcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9