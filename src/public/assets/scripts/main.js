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
angular.module('dias.transects').controller('TransectController', ["$scope", "$attrs", "TransectImage", function ($scope, $attrs, TransectImage) {
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

        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the ids array without the elements that are not present in $scope.images.ids
        // assumes that $scope.images.ids is sorted
        // doesn't change the ordering of elements in the ids array
        var filterSubsetOfTransectIDs = function (ids) {
            var transectIds = $scope.images.ids;
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedIds = ids.slice(0).sort(compareNumbers);
            // here we will put all items of ids that are not present in transectIds
            var notThere = [];
            var i = 0, j = 0;
            while (i < transectIds.length && j < sortedIds.length) {
                if (transectIds[i] < sortedIds[j]) {
                    i++;
                } else if (transectIds[i] === sortedIds[j]) {
                    i++;
                    j++;
                } else {
                    notThere.push(sortedIds[j++]);
                }
            }
            // ad possible missing items if sortedIds is longer than transectIds
            while (j < sortedIds.length) {
                notThere.push(sortedIds[j++]);
            }

            // now remove all elements from ids that are not in transectIds
            // we do it this way because the notThere array will probably always be very small
            for (i = 0; i < notThere.length; i++) {
                // we can assume that indexOf is never <0
                ids.splice(ids.indexOf(notThere[i]), 1);
            }
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
                filterSubsetOfTransectIDs($scope.images.sequence);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify($scope.images.sequence);
            // reset limit
            $scope.images.limit = initialLimit;
            $scope.$broadcast('transects.images.new-sequence');
        };

        // array of all image ids of this transect
        $scope.images.ids = TransectImage.query({transect_id: $scope.transectId}, function (ids) {
            // sort the IDs, we'll need this for the later subset-check of new image seuqences
            $scope.images.ids.sort(compareNumbers);
            $scope.images.length = ids.length;

            if (window.localStorage[imagesLocalStorageKey]) {
                $scope.images.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
                // check if all images loaded from storage are still there in the transect.
                // some of them may have been deleted in the meantime.
                filterSubsetOfTransectIDs($scope.images.sequence);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO0lBQ0EsT0FBQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFBLFlBQUE7OztnQkFHQTtnQkFDQTs7WUFFQSxJQUFBLHFCQUFBLEdBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7RUFJQSxTQUFBO1FBQ0EsT0FBQSxJQUFBLGlDQUFBLFlBQUE7WUFDQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNERBQUEsVUFBQSxRQUFBLFFBQUEsZUFBQTtFQUNBOzs7UUFHQSxJQUFBLGVBQUE7O1FBRUEsSUFBQSx3QkFBQSxvQkFBQSxPQUFBLGFBQUE7O1FBRUEsT0FBQSxhQUFBLE9BQUE7O1FBRUEsT0FBQSxTQUFBOztZQUVBLEtBQUE7O1lBRUEsVUFBQTs7WUFFQSxPQUFBOztZQUVBLFFBQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFVBQUEsR0FBQSxHQUFBO1lBQ0EsT0FBQSxJQUFBOzs7Ozs7UUFNQSxJQUFBLDRCQUFBLFVBQUEsS0FBQTtZQUNBLElBQUEsY0FBQSxPQUFBLE9BQUE7O1lBRUEsSUFBQSxZQUFBLElBQUEsTUFBQSxHQUFBLEtBQUE7O1lBRUEsSUFBQSxXQUFBO1lBQ0EsSUFBQSxJQUFBLEdBQUEsSUFBQTtZQUNBLE9BQUEsSUFBQSxZQUFBLFVBQUEsSUFBQSxVQUFBLFFBQUE7Z0JBQ0EsSUFBQSxZQUFBLEtBQUEsVUFBQSxJQUFBO29CQUNBO3VCQUNBLElBQUEsWUFBQSxPQUFBLFVBQUEsSUFBQTtvQkFDQTtvQkFDQTt1QkFDQTtvQkFDQSxTQUFBLEtBQUEsVUFBQTs7OztZQUlBLE9BQUEsSUFBQSxVQUFBLFFBQUE7Z0JBQ0EsU0FBQSxLQUFBLFVBQUE7Ozs7O1lBS0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxTQUFBLFFBQUEsS0FBQTs7Z0JBRUEsSUFBQSxPQUFBLElBQUEsUUFBQSxTQUFBLEtBQUE7Ozs7UUFJQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQSxDQUFBLE9BQUEsT0FBQTs0QkFDQSxLQUFBLElBQUEsT0FBQSxPQUFBLFFBQUEsT0FBQSxPQUFBLFFBQUEsS0FBQTs4QkFDQTs0QkFDQTs7OztRQUlBLE9BQUEsb0JBQUEsVUFBQSxVQUFBOzs7Ozs7Ozs7WUFTQSxJQUFBLENBQUEsVUFBQTs7Z0JBRUEsT0FBQSxPQUFBLFdBQUEsT0FBQSxPQUFBO21CQUNBO2dCQUNBLE9BQUEsT0FBQSxXQUFBOzs7Z0JBR0EsMEJBQUEsT0FBQSxPQUFBOzs7WUFHQSxPQUFBLGFBQUEseUJBQUEsS0FBQSxVQUFBLE9BQUEsT0FBQTs7WUFFQSxPQUFBLE9BQUEsUUFBQTtZQUNBLE9BQUEsV0FBQTs7OztRQUlBLE9BQUEsT0FBQSxNQUFBLGNBQUEsTUFBQSxDQUFBLGFBQUEsT0FBQSxhQUFBLFVBQUEsS0FBQTs7WUFFQSxPQUFBLE9BQUEsSUFBQSxLQUFBO1lBQ0EsT0FBQSxPQUFBLFNBQUEsSUFBQTs7WUFFQSxJQUFBLE9BQUEsYUFBQSx3QkFBQTtnQkFDQSxPQUFBLE9BQUEsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7Z0JBR0EsMEJBQUEsT0FBQSxPQUFBO21CQUNBO2dCQUNBLE9BQUEsT0FBQSxXQUFBOzs7Ozs7Ozs7Ozs7O0FDekdBLFFBQUEsT0FBQSxrQkFBQSxVQUFBLG9CQUFBLFVBQUEsSUFBQTtRQUNBOztRQUVBLE9BQUE7WUFDQSxVQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7Z0JBRUEsSUFBQSxXQUFBLEdBQUE7Z0JBQ0EsTUFBQSxhQUFBLFNBQUEsU0FBQSxLQUFBLFlBQUE7b0JBQ0EsUUFBQSxLQUFBLGNBQUEsU0FBQTtvQkFDQSxNQUFBLEtBQUEsT0FBQSxNQUFBOzs7Ozs7QUFNQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSAkZWxlbWVudFswXTtcblx0XHR2YXIgYm91bmRpbmdSZWN0LCB0aW1lb3V0UHJvbWlzZTtcblx0XHQvLyBhZGQgdGhpcyBtYW55IGltYWdlcyBmb3IgZWFjaCBzdGVwXG5cdFx0dmFyIHN0ZXAgPSAyMDtcblx0XHQvLyBvZmZzZXQgb2YgdGhlIGVsZW1lbnQgYm90dG9tIHRvIHRoZSB3aW5kb3cgbG93ZXIgYm91bmQgaW4gcGl4ZWxzIGF0XG5cdFx0Ly8gd2hpY2ggYSBuZXcgYnVuY2ggb2YgaW1hZ2VzIHNob3VsZCBiZSBkaXNwbGF5ZWRcblx0XHR2YXIgbmV3U3RlcE9mZnNldCA9IDEwMDtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGltYWdlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGxvYWQgaW4gcGFyYWxsZWxcbiAgICAgICAgdmFyIHBhcmFsbGVsQ29ubmVjdGlvbnMgPSAxMDtcbiAgICAgICAgLy8gc3RvcmVzIHRoZSBwcm9taXNlcyBvZiB0aGUgaW1hZ2VzIHRoYXQgd2FudCB0byBsb2FkXG4gICAgICAgIHZhciBsb2FkU3RhY2sgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGltYWdlcyB0aGF0IGFyZSBjdXJyZW50bHkgbG9hZGluZ1xuICAgICAgICB2YXIgY3VycmVudGx5TG9hZGluZyA9IDA7XG5cblx0XHR2YXIgbmVlZHNOZXdTdGVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ym91bmRpbmdSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdHJldHVybiBlbGVtZW50LnNjcm9sbFRvcCA+PSBlbGVtZW50LnNjcm9sbEhlaWdodCAtIGVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gbmV3U3RlcE9mZnNldDtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrTG93ZXJCb3VuZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHQkc2NvcGUuaW1hZ2VzLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHQkc2NvcGUuaW1hZ2VzLmxpbWl0ICs9IHN0ZXA7XG5cdFx0XHRcdHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoaW5pdGlhbGl6ZSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBpbml0aWF0ZSBsb2FkaW5nIG9mIHRoZSBuZXh0IGltYWdlIGlmIHRoZXJlIGFyZSBzdGlsbCB1bnVzZWQgcGFyYWxsZWwgY29ubmVjdGlvbnNcbiAgICAgICAgdmFyIG1heWJlTG9hZE5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudGx5TG9hZGluZyA8IHBhcmFsbGVsQ29ubmVjdGlvbnMgJiYgbG9hZFN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nKys7XG4gICAgICAgICAgICAgICAgbG9hZFN0YWNrLnBvcCgpLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aW1lb3V0IHRvIHdhaXQgZm9yIGFsbCBpbWFnZSBvYmplY3RzIHRvIGJlIHByZXNlbnQgaW4gdGhlIERPTVxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1zZXF1ZW5jZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFRyYW5zZWN0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gR2xvYmFsIGNvbnRyb2xsZXIgZm9yIHRoZSB0cmFuc2VjdHMgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIFRyYW5zZWN0SW1hZ2UpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBudW1iZXIgb2YgaW5pdGlhbGx5IHNob3duIGltYWdlc1xuICAgICAgICB2YXIgaW5pdGlhbExpbWl0ID0gMjA7XG5cbiAgICAgICAgdmFyIGltYWdlc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgJGF0dHJzLnRyYW5zZWN0SWQgKyAnLmltYWdlcyc7XG5cbiAgICAgICAgJHNjb3BlLnRyYW5zZWN0SWQgPSAkYXR0cnMudHJhbnNlY3RJZDtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0ge1xuICAgICAgICAgICAgLy8gYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3QgaW4gYXJiaXJ0YXJ5IG9yZGVyaW5nXG4gICAgICAgICAgICBpZHM6IFtdLFxuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgICAgICBzZXF1ZW5jZTogW10sXG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICAgICAgbGltaXQ6IGluaXRpYWxMaW1pdCxcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICAgICAgbGVuZ3RoOiB1bmRlZmluZWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBhcnJheS5zb3J0KCkgd2l0aCBudW1iZXJzXG4gICAgICAgIHZhciBjb21wYXJlTnVtYmVycyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB0aGUgaWRzIGFycmF5IHdpdGhvdXQgdGhlIGVsZW1lbnRzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluICRzY29wZS5pbWFnZXMuaWRzXG4gICAgICAgIC8vIGFzc3VtZXMgdGhhdCAkc2NvcGUuaW1hZ2VzLmlkcyBpcyBzb3J0ZWRcbiAgICAgICAgLy8gZG9lc24ndCBjaGFuZ2UgdGhlIG9yZGVyaW5nIG9mIGVsZW1lbnRzIGluIHRoZSBpZHMgYXJyYXlcbiAgICAgICAgdmFyIGZpbHRlclN1YnNldE9mVHJhbnNlY3RJRHMgPSBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICB2YXIgdHJhbnNlY3RJZHMgPSAkc2NvcGUuaW1hZ2VzLmlkcztcbiAgICAgICAgICAgIC8vIGNsb25lIHRoZSBpbnB1dCBhcnJheSAoc28gaXQgaXNuJ3QgY2hhbmdlZCBieSBzb3J0aW5nKSwgdGhlbiBzb3J0IGl0XG4gICAgICAgICAgICB2YXIgc29ydGVkSWRzID0gaWRzLnNsaWNlKDApLnNvcnQoY29tcGFyZU51bWJlcnMpO1xuICAgICAgICAgICAgLy8gaGVyZSB3ZSB3aWxsIHB1dCBhbGwgaXRlbXMgb2YgaWRzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHRyYW5zZWN0SWRzXG4gICAgICAgICAgICB2YXIgbm90VGhlcmUgPSBbXTtcbiAgICAgICAgICAgIHZhciBpID0gMCwgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaSA8IHRyYW5zZWN0SWRzLmxlbmd0aCAmJiBqIDwgc29ydGVkSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICh0cmFuc2VjdElkc1tpXSA8IHNvcnRlZElkc1tqXSkge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0cmFuc2VjdElkc1tpXSA9PT0gc29ydGVkSWRzW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vdFRoZXJlLnB1c2goc29ydGVkSWRzW2orK10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGFkIHBvc3NpYmxlIG1pc3NpbmcgaXRlbXMgaWYgc29ydGVkSWRzIGlzIGxvbmdlciB0aGFuIHRyYW5zZWN0SWRzXG4gICAgICAgICAgICB3aGlsZSAoaiA8IHNvcnRlZElkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBub3RUaGVyZS5wdXNoKHNvcnRlZElkc1tqKytdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbm93IHJlbW92ZSBhbGwgZWxlbWVudHMgZnJvbSBpZHMgdGhhdCBhcmUgbm90IGluIHRyYW5zZWN0SWRzXG4gICAgICAgICAgICAvLyB3ZSBkbyBpdCB0aGlzIHdheSBiZWNhdXNlIHRoZSBub3RUaGVyZSBhcnJheSB3aWxsIHByb2JhYmx5IGFsd2F5cyBiZSB2ZXJ5IHNtYWxsXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbm90VGhlcmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYXNzdW1lIHRoYXQgaW5kZXhPZiBpcyBuZXZlciA8MFxuICAgICAgICAgICAgICAgIGlkcy5zcGxpY2UoaWRzLmluZGV4T2Yobm90VGhlcmVbaV0pLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAgKCRzY29wZS5pbWFnZXMubGVuZ3RoID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigkc2NvcGUuaW1hZ2VzLmxpbWl0IC8gJHNjb3BlLmltYWdlcy5sZW5ndGgsIDEpICogMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICApICsgJyUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXF1ZW5jZSkge1xuICAgICAgICAgICAgLy8gVE9ETyBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZSBpbWFnZSBzZXF1ZW5jZSAob3JkZXJpbmcpIGFuZCBmaWx0ZXJpbmcuXG4gICAgICAgICAgICAvLyB3aGlsZSBvbmUgc2VxdWVuY2Ugc2hvdWxkIHJlcGxhY2UgdGhlIG90aGVyIChsaWtlIGl0IGlzIG5vdyksIGFuIGltYWdlXG4gICAgICAgICAgICAvLyBzZXF1ZW5jZSBhbmQgZmlsdGVyaW5nIGNhbiBiZSBtZXJnZWQgKGN1cnJlbnRseSBub3QgcG9zc2libGUpLlxuICAgICAgICAgICAgLy8gbWFrZSBvbmUgZnVuY3Rpb24gZm9yIHNldHRpbmcgdGhlIHNlcXVlbmNlIGFuZCBvbmUgZm9yIHNldHRpbmcgdGhlIGZpbHRlcmluZyxcbiAgICAgICAgICAgIC8vIHRoZW4gbWVyZ2UgdGhlIHR3byB0byB0aGUgZmluYWwgc2V0IG9mIGRpc3BsYXllZCBpbWFnZXMuXG4gICAgICAgICAgICAvLyB0aGlzIGZpbmFsIHNldCBzaG91bGQgYmUgdGhlIG9uZSB0byBiZSBzdG9yZWQgaW4gbG9jYWwgc3RvcmFnZVxuICAgICAgICAgICAgLy8gKGFuZCBlLmcuIHVzZWQgYnkgdGhlIGFubm90YXRvcikuXG5cbiAgICAgICAgICAgIGlmICghc2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCwgbm8gZmlsdGVyaW5nIG5lZWRlZFxuICAgICAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSAkc2NvcGUuaW1hZ2VzLmlkcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IHNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIC8vIHRha2Ugb25seSB0aG9zZSBJRHMgdGhhdCBhY3R1YWxseSBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiBJRHMgYXJlIHRha2VuIGZyb20gbG9jYWwgc3RvcmFnZSBidXQgdGhlIHRyYW5zZWN0IGhhcyBjaGFuZ2VkKVxuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldE9mVHJhbnNlY3RJRHMoJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KCRzY29wZS5pbWFnZXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhcnJheSBvZiBhbGwgaW1hZ2UgaWRzIG9mIHRoaXMgdHJhbnNlY3RcbiAgICAgICAgJHNjb3BlLmltYWdlcy5pZHMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogJHNjb3BlLnRyYW5zZWN0SWR9LCBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICAvLyBzb3J0IHRoZSBJRHMsIHdlJ2xsIG5lZWQgdGhpcyBmb3IgdGhlIGxhdGVyIHN1YnNldC1jaGVjayBvZiBuZXcgaW1hZ2Ugc2V1cWVuY2VzXG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLmlkcy5zb3J0KGNvbXBhcmVOdW1iZXJzKTtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMubGVuZ3RoID0gaWRzLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGltYWdlcyBsb2FkZWQgZnJvbSBzdG9yYWdlIGFyZSBzdGlsbCB0aGVyZSBpbiB0aGUgdHJhbnNlY3QuXG4gICAgICAgICAgICAgICAgLy8gc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZCBpbiB0aGUgbWVhbnRpbWUuXG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0T2ZUcmFuc2VjdElEcygkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IGlkcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9