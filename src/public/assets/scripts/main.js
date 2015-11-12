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

        // timeout to wait for all image objects to be present in the DOM
		$timeout(initialize);
        $scope.$on('transects.images.new-sequence', function () {
            $timeout(initialize);
        });
	}]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', ["$scope", "$attrs", "TransectImage", "filterSubset", function ($scope, $attrs, TransectImage, filterSubset) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + $attrs.transectId + '.images';

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
                width:  ($scope.images.length ?
                            Math.min($scope.images.limit / $scope.images.length, 1) * 100
                            : 0
                        ) + '%'
            };
        };

        $scope.setImagesSequence = function (sequence) {
            // TODO distinguish between the image sequence (ordering) and filtering.
            // while one sequence should replace the other (like it is now), an image
            // sequence and filtering can be merged (currently not possible).
            // make one function for setting the sequence and one for setting the filtering,
            // then merge the two to the final set of displayed images.
            // this final set should be the one to be stored in local storage
            // (and e.g. used by the annotator).

            if (!sequence) {
                // reset, no filtering needed
                $scope.images.sequence = $scope.images.ids;
            } else {
                $scope.images.sequence = sequence;
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset($scope.images.sequence, $scope.images.ids, true);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify($scope.images.sequence);
            // reset limit
            $scope.images.limit = initialLimit;
            $scope.$broadcast('transects.images.new-sequence');
        };

        // array of all image ids of this transect
        $scope.images.ids = TransectImage.query({transect_id: $scope.transectId}, function (ids) {
            // sort the IDs, we'll need this for the later subset-check of new image seuqences
            $scope.images.ids.sort(function (a, b) {
                return a - b;
            });
            $scope.images.length = ids.length;

            if (window.localStorage[imagesLocalStorageKey]) {
                $scope.images.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
                // check if all images loaded from storage are still there in the transect.
                // some of them may have been deleted in the meantime.
                filterSubset($scope.images.sequence, $scope.images.ids, true);
            } else {
                $scope.images.sequence = ids;
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO0lBQ0EsT0FBQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFBLFlBQUE7OztnQkFHQTtnQkFDQTs7WUFFQSxJQUFBLHFCQUFBLEdBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7RUFJQSxTQUFBO1FBQ0EsT0FBQSxJQUFBLGlDQUFBLFlBQUE7WUFDQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNEVBQUEsVUFBQSxRQUFBLFFBQUEsZUFBQSxjQUFBO0VBQ0E7OztRQUdBLElBQUEsZUFBQTs7UUFFQSxJQUFBLHdCQUFBLG9CQUFBLE9BQUEsYUFBQTs7UUFFQSxPQUFBLGFBQUEsT0FBQTs7UUFFQSxPQUFBLFNBQUE7O1lBRUEsS0FBQTs7WUFFQSxVQUFBOztZQUVBLE9BQUE7O1lBRUEsUUFBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBO2dCQUNBLFFBQUEsQ0FBQSxPQUFBLE9BQUE7NEJBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLEtBQUE7OEJBQ0E7NEJBQ0E7Ozs7UUFJQSxPQUFBLG9CQUFBLFVBQUEsVUFBQTs7Ozs7Ozs7O1lBU0EsSUFBQSxDQUFBLFVBQUE7O2dCQUVBLE9BQUEsT0FBQSxXQUFBLE9BQUEsT0FBQTttQkFDQTtnQkFDQSxPQUFBLE9BQUEsV0FBQTs7O2dCQUdBLGFBQUEsT0FBQSxPQUFBLFVBQUEsT0FBQSxPQUFBLEtBQUE7OztZQUdBLE9BQUEsYUFBQSx5QkFBQSxLQUFBLFVBQUEsT0FBQSxPQUFBOztZQUVBLE9BQUEsT0FBQSxRQUFBO1lBQ0EsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxPQUFBLE1BQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxPQUFBLGFBQUEsVUFBQSxLQUFBOztZQUVBLE9BQUEsT0FBQSxJQUFBLEtBQUEsVUFBQSxHQUFBLEdBQUE7Z0JBQ0EsT0FBQSxJQUFBOztZQUVBLE9BQUEsT0FBQSxTQUFBLElBQUE7O1lBRUEsSUFBQSxPQUFBLGFBQUEsd0JBQUE7Z0JBQ0EsT0FBQSxPQUFBLFdBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O2dCQUdBLGFBQUEsT0FBQSxPQUFBLFVBQUEsT0FBQSxPQUFBLEtBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxPQUFBLFdBQUE7Ozs7Ozs7Ozs7Ozs7QUNyRUEsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7OztBQU1BIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBkaXNwbGF5aW5nIHRoZSBodWdlIGFtb3V0IG9mIGltYWdlcyBvZiBhXG4gKiB0cmFuc2VjdCBvbiBhIHNpbmdlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJHRpbWVvdXQsICRxKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5pbWFnZXMubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdCRzY29wZS5pbWFnZXMubGltaXQgKz0gc3RlcDtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHNob3VsZCBsb2FkXG4gICAgICAgIC8vIGdldHMgYSBwcm9taXNlIGFzIGFyZ2ltZW50IHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAkc2NvcGUuZW5xdWV1ZUltYWdlID0gZnVuY3Rpb24gKGltYWdlTG9hZGVkKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgLy8gYWRkIHRoZSBcInNob3VsZCBsb2FkXCIgcHJvbWlzZSB0byB0aGUgc3RhY2tcbiAgICAgICAgICAgIGxvYWRTdGFjay5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlbnF1ZXVlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgaW1hZ2VMb2FkZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xvYWRlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIGxvYWQgdGhlIG5leHQgaW1hZ2UgaW4gdGhlIHN0YWNrXG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZy0tO1xuICAgICAgICAgICAgICAgIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUxvYWRpbmcgPT09IDApIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHRpbWVvdXQgdG8gd2FpdCBmb3IgYWxsIGltYWdlIG9iamVjdHMgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LXNlcXVlbmNlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycywgVHJhbnNlY3RJbWFnZSwgZmlsdGVyU3Vic2V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGluaXRpYWxseSBzaG93biBpbWFnZXNcbiAgICAgICAgdmFyIGluaXRpYWxMaW1pdCA9IDIwO1xuXG4gICAgICAgIHZhciBpbWFnZXNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArICRhdHRycy50cmFuc2VjdElkICsgJy5pbWFnZXMnO1xuXG4gICAgICAgICRzY29wZS50cmFuc2VjdElkID0gJGF0dHJzLnRyYW5zZWN0SWQ7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IHtcbiAgICAgICAgICAgIC8vIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0IGluIGFyYmlydGFyeSBvcmRlcmluZ1xuICAgICAgICAgICAgaWRzOiBbXSxcbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50bHkgZGlzcGxheWVkIG9yZGVyaW5nIG9mIGltYWdlcyAoYXMgYXJyYXkgb2YgaW1hZ2UgSURzKVxuICAgICAgICAgICAgc2VxdWVuY2U6IFtdLFxuICAgICAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgICAgIGxpbWl0OiBpbml0aWFsTGltaXQsXG4gICAgICAgICAgICAvLyBudW1iZXIgb2Ygb3ZlcmFsbCBpbWFnZXNcbiAgICAgICAgICAgIGxlbmd0aDogdW5kZWZpbmVkXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogICgkc2NvcGUuaW1hZ2VzLmxlbmd0aCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oJHNjb3BlLmltYWdlcy5saW1pdCAvICRzY29wZS5pbWFnZXMubGVuZ3RoLCAxKSAqIDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgKSArICclJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0SW1hZ2VzU2VxdWVuY2UgPSBmdW5jdGlvbiAoc2VxdWVuY2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGUgaW1hZ2Ugc2VxdWVuY2UgKG9yZGVyaW5nKSBhbmQgZmlsdGVyaW5nLlxuICAgICAgICAgICAgLy8gd2hpbGUgb25lIHNlcXVlbmNlIHNob3VsZCByZXBsYWNlIHRoZSBvdGhlciAobGlrZSBpdCBpcyBub3cpLCBhbiBpbWFnZVxuICAgICAgICAgICAgLy8gc2VxdWVuY2UgYW5kIGZpbHRlcmluZyBjYW4gYmUgbWVyZ2VkIChjdXJyZW50bHkgbm90IHBvc3NpYmxlKS5cbiAgICAgICAgICAgIC8vIG1ha2Ugb25lIGZ1bmN0aW9uIGZvciBzZXR0aW5nIHRoZSBzZXF1ZW5jZSBhbmQgb25lIGZvciBzZXR0aW5nIHRoZSBmaWx0ZXJpbmcsXG4gICAgICAgICAgICAvLyB0aGVuIG1lcmdlIHRoZSB0d28gdG8gdGhlIGZpbmFsIHNldCBvZiBkaXNwbGF5ZWQgaW1hZ2VzLlxuICAgICAgICAgICAgLy8gdGhpcyBmaW5hbCBzZXQgc2hvdWxkIGJlIHRoZSBvbmUgdG8gYmUgc3RvcmVkIGluIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgICAgIC8vIChhbmQgZS5nLiB1c2VkIGJ5IHRoZSBhbm5vdGF0b3IpLlxuXG4gICAgICAgICAgICBpZiAoIXNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQsIG5vIGZpbHRlcmluZyBuZWVkZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlID0gJHNjb3BlLmltYWdlcy5pZHM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSBzZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICAvLyB0YWtlIG9ubHkgdGhvc2UgSURzIHRoYXQgYWN0dWFsbHkgYmVsb25nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gSURzIGFyZSB0YWtlbiBmcm9tIGxvY2FsIHN0b3JhZ2UgYnV0IHRoZSB0cmFuc2VjdCBoYXMgY2hhbmdlZClcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSwgJHNjb3BlLmltYWdlcy5pZHMsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSgkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LXNlcXVlbmNlJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYXJyYXkgb2YgYWxsIGltYWdlIGlkcyBvZiB0aGlzIHRyYW5zZWN0XG4gICAgICAgICRzY29wZS5pbWFnZXMuaWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6ICRzY29wZS50cmFuc2VjdElkfSwgZnVuY3Rpb24gKGlkcykge1xuICAgICAgICAgICAgLy8gc29ydCB0aGUgSURzLCB3ZSdsbCBuZWVkIHRoaXMgZm9yIHRoZSBsYXRlciBzdWJzZXQtY2hlY2sgb2YgbmV3IGltYWdlIHNldXFlbmNlc1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5pZHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5sZW5ndGggPSBpZHMubGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgICAgICAvLyBzb21lIG9mIHRoZW0gbWF5IGhhdmUgYmVlbiBkZWxldGVkIGluIHRoZSBtZWFudGltZS5cbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSwgJHNjb3BlLmltYWdlcy5pZHMsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlID0gaWRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGF6eUltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhenkgbG9hZGluZyBpbWFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWFnZScsIGZ1bmN0aW9uICgkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBzY29wZS5lbnF1ZXVlSW1hZ2UoZGVmZXJyZWQucHJvbWlzZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnbG9hZCBlcnJvcicsIGRlZmVycmVkLnJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICBhdHRycy4kc2V0KCdzcmMnLCBhdHRycy5sYXp5SW1hZ2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=