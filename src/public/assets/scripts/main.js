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
angular.module('dias.transects').controller('TransectController', ["$scope", "$attrs", "TRANSECT_IMAGES", "filterSubset", function ($scope, $attrs, TRANSECT_IMAGES, filterSubset) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + $attrs.transectId + '.images';

        $scope.transectId = $attrs.transectId;

        $scope.images = {
            // all image IDs of the transect in ascending order
            ids: TRANSECT_IMAGES,
            // the currently displayed ordering of images (as array of image IDs)
            sequence: [],
            // number of currently shown images
            limit: initialLimit,
            // number of overall images
            length: TRANSECT_IMAGES.length,
            // flags to mark special images consisting of the image IDs to mark, a title
            // as description for the flag element and a flag name that will be used to identify
            // the flag and as additional class for the flag element
            flags: {}
        };

        // check for a stored image sorting sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            $scope.images.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset($scope.images.sequence, $scope.images.ids, true);
        } else {
            $scope.images.sequence = $scope.images.ids;
        }

        $scope.progress = function () {
            return {
                width:  ($scope.images.length ?
                            Math.min($scope.images.limit / $scope.images.length, 1) * 100
                            : 0
                        ) + '%'
            };
        };

        // set the ordering of the displayed images
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

        $scope.addImageFlags = function (name, ids, title) {
            $scope.images.flags[name] = {
                name: name,
                ids: ids,
                title: title
            };
        };

        $scope.removeImageFlags = function (name) {
            delete $scope.images.flags[name];
        };

        $scope.getFlagsFor = function (id) {
            var output = [];
            var flags = $scope.images.flags;
            for (var name in flags) {
                if (flags[name].ids.indexOf(id) !== -1) {
                    output.push(flags[name]);
                }
            }

            return output;
        };

        // $scope.addImageFlags('has-roi', [13, 115, 20, 50, 26, 200, 80, 2000], 'This image has a background segmentation region of interest.');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO0lBQ0EsT0FBQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFBLFlBQUE7OztnQkFHQTtnQkFDQTs7WUFFQSxJQUFBLHFCQUFBLEdBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7RUFJQSxTQUFBO1FBQ0EsT0FBQSxJQUFBLGlDQUFBLFlBQUE7WUFDQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLFFBQUEsaUJBQUEsY0FBQTtFQUNBOzs7UUFHQSxJQUFBLGVBQUE7O1FBRUEsSUFBQSx3QkFBQSxvQkFBQSxPQUFBLGFBQUE7O1FBRUEsT0FBQSxhQUFBLE9BQUE7O1FBRUEsT0FBQSxTQUFBOztZQUVBLEtBQUE7O1lBRUEsVUFBQTs7WUFFQSxPQUFBOztZQUVBLFFBQUEsZ0JBQUE7Ozs7WUFJQSxPQUFBOzs7O1FBSUEsSUFBQSxPQUFBLGFBQUEsd0JBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7WUFHQSxhQUFBLE9BQUEsT0FBQSxVQUFBLE9BQUEsT0FBQSxLQUFBO2VBQ0E7WUFDQSxPQUFBLE9BQUEsV0FBQSxPQUFBLE9BQUE7OztRQUdBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxRQUFBLENBQUEsT0FBQSxPQUFBOzRCQUNBLEtBQUEsSUFBQSxPQUFBLE9BQUEsUUFBQSxPQUFBLE9BQUEsUUFBQSxLQUFBOzhCQUNBOzRCQUNBOzs7OztRQUtBLE9BQUEsb0JBQUEsVUFBQSxVQUFBOzs7Ozs7Ozs7WUFTQSxJQUFBLENBQUEsVUFBQTs7Z0JBRUEsT0FBQSxPQUFBLFdBQUEsT0FBQSxPQUFBO21CQUNBO2dCQUNBLE9BQUEsT0FBQSxXQUFBOzs7Z0JBR0EsYUFBQSxPQUFBLE9BQUEsVUFBQSxPQUFBLE9BQUEsS0FBQTs7O1lBR0EsT0FBQSxhQUFBLHlCQUFBLEtBQUEsVUFBQSxPQUFBLE9BQUE7O1lBRUEsT0FBQSxPQUFBLFFBQUE7WUFDQSxPQUFBLFdBQUE7OztRQUdBLE9BQUEsZ0JBQUEsVUFBQSxNQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUEsT0FBQSxNQUFBLFFBQUE7Z0JBQ0EsTUFBQTtnQkFDQSxLQUFBO2dCQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLG1CQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsT0FBQSxPQUFBLE1BQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLElBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxJQUFBLFFBQUEsT0FBQSxPQUFBO1lBQ0EsS0FBQSxJQUFBLFFBQUEsT0FBQTtnQkFDQSxJQUFBLE1BQUEsTUFBQSxJQUFBLFFBQUEsUUFBQSxDQUFBLEdBQUE7b0JBQ0EsT0FBQSxLQUFBLE1BQUE7Ozs7WUFJQSxPQUFBOzs7Ozs7Ozs7Ozs7OztBQzNGQSxRQUFBLE9BQUEsa0JBQUEsVUFBQSxvQkFBQSxVQUFBLElBQUE7UUFDQTs7UUFFQSxPQUFBO1lBQ0EsVUFBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7O2dCQUVBLElBQUEsV0FBQSxHQUFBO2dCQUNBLE1BQUEsYUFBQSxTQUFBLFNBQUEsS0FBQSxZQUFBO29CQUNBLFFBQUEsS0FBQSxjQUFBLFNBQUE7b0JBQ0EsTUFBQSxLQUFBLE9BQUEsTUFBQTs7Ozs7O0FBTUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmcgdGhlIGh1Z2UgYW1vdXQgb2YgaW1hZ2VzIG9mIGFcbiAqIHRyYW5zZWN0IG9uIGEgc2luZ2UgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbWFueSBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmltYWdlcy5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGF0dGVtcHRzIHRvIGZpbGwgdGhlIGN1cnJlbnQgdmlld3BvcnQgd2l0aCBpbWFnZXNcblx0XHQvLyB1c2VzICR0aW1lb3V0IHRvIHdhaXQgZm9yIERPTSByZW5kZXJpbmcsIHRoZW4gY2hlY2tzIGFnYWluXG5cdFx0dmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmltYWdlcy5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gaW5pdGlhdGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBpZiB0aGVyZSBhcmUgc3RpbGwgdW51c2VkIHBhcmFsbGVsIGNvbm5lY3Rpb25zXG4gICAgICAgIHZhciBtYXliZUxvYWROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRseUxvYWRpbmcgPCBwYXJhbGxlbENvbm5lY3Rpb25zICYmIGxvYWRTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZysrO1xuICAgICAgICAgICAgICAgIGxvYWRTdGFjay5wb3AoKS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugc2hvdWxkIGxvYWRcbiAgICAgICAgLy8gZ2V0cyBhIHByb21pc2UgYXMgYXJnaW1lbnQgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICRzY29wZS5lbnF1ZXVlSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VMb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIFwic2hvdWxkIGxvYWRcIiBwcm9taXNlIHRvIHRoZSBzdGFja1xuICAgICAgICAgICAgbG9hZFN0YWNrLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2VucXVldWVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpbWFnZUxvYWRlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gbG9hZCB0aGUgbmV4dCBpbWFnZSBpbiB0aGUgc3RhY2tcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nLS07XG4gICAgICAgICAgICAgICAgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudGx5TG9hZGluZyA9PT0gMCkgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGltZW91dCB0byB3YWl0IGZvciBhbGwgaW1hZ2Ugb2JqZWN0cyB0byBiZSBwcmVzZW50IGluIHRoZSBET01cblx0XHQkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgJHNjb3BlLiRvbigndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzLCBUUkFOU0VDVF9JTUFHRVMsIGZpbHRlclN1YnNldCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBpbml0aWFsbHkgc2hvd24gaW1hZ2VzXG4gICAgICAgIHZhciBpbml0aWFsTGltaXQgPSAyMDtcblxuICAgICAgICB2YXIgaW1hZ2VzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyAkYXR0cnMudHJhbnNlY3RJZCArICcuaW1hZ2VzJztcblxuICAgICAgICAkc2NvcGUudHJhbnNlY3RJZCA9ICRhdHRycy50cmFuc2VjdElkO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSB7XG4gICAgICAgICAgICAvLyBhbGwgaW1hZ2UgSURzIG9mIHRoZSB0cmFuc2VjdCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICAgICAgICAgIGlkczogVFJBTlNFQ1RfSU1BR0VTLFxuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgICAgICBzZXF1ZW5jZTogW10sXG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICAgICAgbGltaXQ6IGluaXRpYWxMaW1pdCxcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICAgICAgbGVuZ3RoOiBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoLFxuICAgICAgICAgICAgLy8gZmxhZ3MgdG8gbWFyayBzcGVjaWFsIGltYWdlcyBjb25zaXN0aW5nIG9mIHRoZSBpbWFnZSBJRHMgdG8gbWFyaywgYSB0aXRsZVxuICAgICAgICAgICAgLy8gYXMgZGVzY3JpcHRpb24gZm9yIHRoZSBmbGFnIGVsZW1lbnQgYW5kIGEgZmxhZyBuYW1lIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGlkZW50aWZ5XG4gICAgICAgICAgICAvLyB0aGUgZmxhZyBhbmQgYXMgYWRkaXRpb25hbCBjbGFzcyBmb3IgdGhlIGZsYWcgZWxlbWVudFxuICAgICAgICAgICAgZmxhZ3M6IHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgc3RvcmVkIGltYWdlIHNvcnRpbmcgc2VxdWVuY2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBpbWFnZXMgbG9hZGVkIGZyb20gc3RvcmFnZSBhcmUgc3RpbGwgdGhlcmUgaW4gdGhlIHRyYW5zZWN0LlxuICAgICAgICAgICAgLy8gc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZCBpbiB0aGUgbWVhbnRpbWUuXG4gICAgICAgICAgICBmaWx0ZXJTdWJzZXQoJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSwgJHNjb3BlLmltYWdlcy5pZHMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9ICRzY29wZS5pbWFnZXMuaWRzO1xuICAgICAgICB9XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogICgkc2NvcGUuaW1hZ2VzLmxlbmd0aCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oJHNjb3BlLmltYWdlcy5saW1pdCAvICRzY29wZS5pbWFnZXMubGVuZ3RoLCAxKSAqIDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgKSArICclJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzZXQgdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXNwbGF5ZWQgaW1hZ2VzXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXF1ZW5jZSkge1xuICAgICAgICAgICAgLy8gVE9ETyBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZSBpbWFnZSBzZXF1ZW5jZSAob3JkZXJpbmcpIGFuZCBmaWx0ZXJpbmcuXG4gICAgICAgICAgICAvLyB3aGlsZSBvbmUgc2VxdWVuY2Ugc2hvdWxkIHJlcGxhY2UgdGhlIG90aGVyIChsaWtlIGl0IGlzIG5vdyksIGFuIGltYWdlXG4gICAgICAgICAgICAvLyBzZXF1ZW5jZSBhbmQgZmlsdGVyaW5nIGNhbiBiZSBtZXJnZWQgKGN1cnJlbnRseSBub3QgcG9zc2libGUpLlxuICAgICAgICAgICAgLy8gbWFrZSBvbmUgZnVuY3Rpb24gZm9yIHNldHRpbmcgdGhlIHNlcXVlbmNlIGFuZCBvbmUgZm9yIHNldHRpbmcgdGhlIGZpbHRlcmluZyxcbiAgICAgICAgICAgIC8vIHRoZW4gbWVyZ2UgdGhlIHR3byB0byB0aGUgZmluYWwgc2V0IG9mIGRpc3BsYXllZCBpbWFnZXMuXG4gICAgICAgICAgICAvLyB0aGlzIGZpbmFsIHNldCBzaG91bGQgYmUgdGhlIG9uZSB0byBiZSBzdG9yZWQgaW4gbG9jYWwgc3RvcmFnZVxuICAgICAgICAgICAgLy8gKGFuZCBlLmcuIHVzZWQgYnkgdGhlIGFubm90YXRvcikuXG5cbiAgICAgICAgICAgIGlmICghc2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCwgbm8gZmlsdGVyaW5nIG5lZWRlZFxuICAgICAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSAkc2NvcGUuaW1hZ2VzLmlkcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSA9IHNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIC8vIHRha2Ugb25seSB0aG9zZSBJRHMgdGhhdCBhY3R1YWxseSBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiBJRHMgYXJlIHRha2VuIGZyb20gbG9jYWwgc3RvcmFnZSBidXQgdGhlIHRyYW5zZWN0IGhhcyBjaGFuZ2VkKVxuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldCgkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlLCAkc2NvcGUuaW1hZ2VzLmlkcywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KCRzY29wZS5pbWFnZXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkSW1hZ2VGbGFncyA9IGZ1bmN0aW9uIChuYW1lLCBpZHMsIHRpdGxlKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLmZsYWdzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgaWRzOiBpZHMsXG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmVJbWFnZUZsYWdzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuaW1hZ2VzLmZsYWdzW25hbWVdO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRGbGFnc0ZvciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAgICAgdmFyIGZsYWdzID0gJHNjb3BlLmltYWdlcy5mbGFncztcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3NbbmFtZV0uaWRzLmluZGV4T2YoaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChmbGFnc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vICRzY29wZS5hZGRJbWFnZUZsYWdzKCdoYXMtcm9pJywgWzEzLCAxMTUsIDIwLCA1MCwgMjYsIDIwMCwgODAsIDIwMDBdLCAnVGhpcyBpbWFnZSBoYXMgYSBiYWNrZ3JvdW5kIHNlZ21lbnRhdGlvbiByZWdpb24gb2YgaW50ZXJlc3QuJyk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9