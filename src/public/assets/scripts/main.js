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
        var settingsLocalStorageKey = 'dias.transects.settings';

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

        // client-side (default) settings for all transect index pages
        $scope.settings = {
            show_flags: true
        };

        // extend/override default settings with local ones
        if (window.localStorage[settingsLocalStorageKey]) {
            angular.extend(
                $scope.settings,
                JSON.parse(window.localStorage[settingsLocalStorageKey])
            );
        }

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

        $scope.setSettings = function (key, value) {
            $scope.settings[key] = value;
            window.localStorage[settingsLocalStorageKey] = JSON.stringify($scope.settings);
        };
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO0lBQ0EsT0FBQSxPQUFBLFNBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsZ0JBQUE7SUFDQSxPQUFBLE9BQUEsU0FBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFBLFlBQUE7OztnQkFHQTtnQkFDQTs7WUFFQSxJQUFBLHFCQUFBLEdBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7RUFJQSxTQUFBO1FBQ0EsT0FBQSxJQUFBLGlDQUFBLFlBQUE7WUFDQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLFFBQUEsaUJBQUEsY0FBQTtFQUNBOzs7UUFHQSxJQUFBLGVBQUE7O1FBRUEsSUFBQSx3QkFBQSxvQkFBQSxPQUFBLGFBQUE7UUFDQSxJQUFBLDBCQUFBOztRQUVBLE9BQUEsYUFBQSxPQUFBOztRQUVBLE9BQUEsU0FBQTs7WUFFQSxLQUFBOztZQUVBLFVBQUE7O1lBRUEsT0FBQTs7WUFFQSxRQUFBLGdCQUFBOzs7O1lBSUEsT0FBQTs7OztRQUlBLE9BQUEsV0FBQTtZQUNBLFlBQUE7Ozs7UUFJQSxJQUFBLE9BQUEsYUFBQSwwQkFBQTtZQUNBLFFBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7OztRQUtBLElBQUEsT0FBQSxhQUFBLHdCQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1lBR0EsYUFBQSxPQUFBLE9BQUEsVUFBQSxPQUFBLE9BQUEsS0FBQTtlQUNBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsT0FBQSxPQUFBOzs7UUFHQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQSxDQUFBLE9BQUEsT0FBQTs0QkFDQSxLQUFBLElBQUEsT0FBQSxPQUFBLFFBQUEsT0FBQSxPQUFBLFFBQUEsS0FBQTs4QkFDQTs0QkFDQTs7Ozs7UUFLQSxPQUFBLG9CQUFBLFVBQUEsVUFBQTs7Ozs7Ozs7O1lBU0EsSUFBQSxDQUFBLFVBQUE7O2dCQUVBLE9BQUEsT0FBQSxXQUFBLE9BQUEsT0FBQTttQkFDQTtnQkFDQSxPQUFBLE9BQUEsV0FBQTs7O2dCQUdBLGFBQUEsT0FBQSxPQUFBLFVBQUEsT0FBQSxPQUFBLEtBQUE7OztZQUdBLE9BQUEsYUFBQSx5QkFBQSxLQUFBLFVBQUEsT0FBQSxPQUFBOztZQUVBLE9BQUEsT0FBQSxRQUFBO1lBQ0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLGdCQUFBLFVBQUEsTUFBQSxLQUFBLE9BQUE7WUFDQSxPQUFBLE9BQUEsTUFBQSxRQUFBO2dCQUNBLE1BQUE7Z0JBQ0EsS0FBQTtnQkFDQSxPQUFBOzs7O1FBSUEsT0FBQSxtQkFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsT0FBQSxNQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxJQUFBO1lBQ0EsSUFBQSxTQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsT0FBQTtZQUNBLEtBQUEsSUFBQSxRQUFBLE9BQUE7Z0JBQ0EsSUFBQSxNQUFBLE1BQUEsSUFBQSxRQUFBLFFBQUEsQ0FBQSxHQUFBO29CQUNBLE9BQUEsS0FBQSxNQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsT0FBQSxjQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUE7WUFDQSxPQUFBLGFBQUEsMkJBQUEsS0FBQSxVQUFBLE9BQUE7Ozs7Ozs7Ozs7OztBQzlHQSxRQUFBLE9BQUEsa0JBQUEsVUFBQSxvQkFBQSxVQUFBLElBQUE7UUFDQTs7UUFFQSxPQUFBO1lBQ0EsVUFBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7O2dCQUVBLElBQUEsV0FBQSxHQUFBO2dCQUNBLE1BQUEsYUFBQSxTQUFBLFNBQUEsS0FBQSxZQUFBO29CQUNBLFFBQUEsS0FBQSxjQUFBLFNBQUE7b0JBQ0EsTUFBQSxLQUFBLE9BQUEsTUFBQTs7Ozs7O0FBTUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmcgdGhlIGh1Z2UgYW1vdXQgb2YgaW1hZ2VzIG9mIGFcbiAqIHRyYW5zZWN0IG9uIGEgc2luZ2UgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbWFueSBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmltYWdlcy5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGF0dGVtcHRzIHRvIGZpbGwgdGhlIGN1cnJlbnQgdmlld3BvcnQgd2l0aCBpbWFnZXNcblx0XHQvLyB1c2VzICR0aW1lb3V0IHRvIHdhaXQgZm9yIERPTSByZW5kZXJpbmcsIHRoZW4gY2hlY2tzIGFnYWluXG5cdFx0dmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcblx0XHRcdFx0JHNjb3BlLmltYWdlcy5saW1pdCArPSBzdGVwO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gaW5pdGlhdGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBpZiB0aGVyZSBhcmUgc3RpbGwgdW51c2VkIHBhcmFsbGVsIGNvbm5lY3Rpb25zXG4gICAgICAgIHZhciBtYXliZUxvYWROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRseUxvYWRpbmcgPCBwYXJhbGxlbENvbm5lY3Rpb25zICYmIGxvYWRTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZysrO1xuICAgICAgICAgICAgICAgIGxvYWRTdGFjay5wb3AoKS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugc2hvdWxkIGxvYWRcbiAgICAgICAgLy8gZ2V0cyBhIHByb21pc2UgYXMgYXJnaW1lbnQgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICRzY29wZS5lbnF1ZXVlSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VMb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIFwic2hvdWxkIGxvYWRcIiBwcm9taXNlIHRvIHRoZSBzdGFja1xuICAgICAgICAgICAgbG9hZFN0YWNrLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2VucXVldWVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpbWFnZUxvYWRlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gbG9hZCB0aGUgbmV4dCBpbWFnZSBpbiB0aGUgc3RhY2tcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nLS07XG4gICAgICAgICAgICAgICAgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudGx5TG9hZGluZyA9PT0gMCkgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGltZW91dCB0byB3YWl0IGZvciBhbGwgaW1hZ2Ugb2JqZWN0cyB0byBiZSBwcmVzZW50IGluIHRoZSBET01cblx0XHQkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgJHNjb3BlLiRvbigndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzLCBUUkFOU0VDVF9JTUFHRVMsIGZpbHRlclN1YnNldCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBpbml0aWFsbHkgc2hvd24gaW1hZ2VzXG4gICAgICAgIHZhciBpbml0aWFsTGltaXQgPSAyMDtcblxuICAgICAgICB2YXIgaW1hZ2VzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyAkYXR0cnMudHJhbnNlY3RJZCArICcuaW1hZ2VzJztcbiAgICAgICAgdmFyIHNldHRpbmdzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLnNldHRpbmdzJztcblxuICAgICAgICAkc2NvcGUudHJhbnNlY3RJZCA9ICRhdHRycy50cmFuc2VjdElkO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSB7XG4gICAgICAgICAgICAvLyBhbGwgaW1hZ2UgSURzIG9mIHRoZSB0cmFuc2VjdCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICAgICAgICAgIGlkczogVFJBTlNFQ1RfSU1BR0VTLFxuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgICAgICBzZXF1ZW5jZTogW10sXG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICAgICAgbGltaXQ6IGluaXRpYWxMaW1pdCxcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICAgICAgbGVuZ3RoOiBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoLFxuICAgICAgICAgICAgLy8gZmxhZ3MgdG8gbWFyayBzcGVjaWFsIGltYWdlcyBjb25zaXN0aW5nIG9mIHRoZSBpbWFnZSBJRHMgdG8gbWFyaywgYSB0aXRsZVxuICAgICAgICAgICAgLy8gYXMgZGVzY3JpcHRpb24gZm9yIHRoZSBmbGFnIGVsZW1lbnQgYW5kIGEgZmxhZyBuYW1lIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGlkZW50aWZ5XG4gICAgICAgICAgICAvLyB0aGUgZmxhZyBhbmQgYXMgYWRkaXRpb25hbCBjbGFzcyBmb3IgdGhlIGZsYWcgZWxlbWVudFxuICAgICAgICAgICAgZmxhZ3M6IHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY2xpZW50LXNpZGUgKGRlZmF1bHQpIHNldHRpbmdzIGZvciBhbGwgdHJhbnNlY3QgaW5kZXggcGFnZXNcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0ge1xuICAgICAgICAgICAgc2hvd19mbGFnczogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGV4dGVuZC9vdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzIHdpdGggbG9jYWwgb25lc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKFxuICAgICAgICAgICAgICAgICRzY29wZS5zZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBpbWFnZSBzb3J0aW5nIHNlcXVlbmNlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgIC8vIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICAgICAgZmlsdGVyU3Vic2V0KCRzY29wZS5pbWFnZXMuc2VxdWVuY2UsICRzY29wZS5pbWFnZXMuaWRzLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSAkc2NvcGUuaW1hZ2VzLmlkcztcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICAoJHNjb3BlLmltYWdlcy5sZW5ndGggP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKCRzY29wZS5pbWFnZXMubGltaXQgLyAkc2NvcGUuaW1hZ2VzLmxlbmd0aCwgMSkgKiAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICkgKyAnJSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2V0IHRoZSBvcmRlcmluZyBvZiB0aGUgZGlzcGxheWVkIGltYWdlc1xuICAgICAgICAkc2NvcGUuc2V0SW1hZ2VzU2VxdWVuY2UgPSBmdW5jdGlvbiAoc2VxdWVuY2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGUgaW1hZ2Ugc2VxdWVuY2UgKG9yZGVyaW5nKSBhbmQgZmlsdGVyaW5nLlxuICAgICAgICAgICAgLy8gd2hpbGUgb25lIHNlcXVlbmNlIHNob3VsZCByZXBsYWNlIHRoZSBvdGhlciAobGlrZSBpdCBpcyBub3cpLCBhbiBpbWFnZVxuICAgICAgICAgICAgLy8gc2VxdWVuY2UgYW5kIGZpbHRlcmluZyBjYW4gYmUgbWVyZ2VkIChjdXJyZW50bHkgbm90IHBvc3NpYmxlKS5cbiAgICAgICAgICAgIC8vIG1ha2Ugb25lIGZ1bmN0aW9uIGZvciBzZXR0aW5nIHRoZSBzZXF1ZW5jZSBhbmQgb25lIGZvciBzZXR0aW5nIHRoZSBmaWx0ZXJpbmcsXG4gICAgICAgICAgICAvLyB0aGVuIG1lcmdlIHRoZSB0d28gdG8gdGhlIGZpbmFsIHNldCBvZiBkaXNwbGF5ZWQgaW1hZ2VzLlxuICAgICAgICAgICAgLy8gdGhpcyBmaW5hbCBzZXQgc2hvdWxkIGJlIHRoZSBvbmUgdG8gYmUgc3RvcmVkIGluIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgICAgIC8vIChhbmQgZS5nLiB1c2VkIGJ5IHRoZSBhbm5vdGF0b3IpLlxuXG4gICAgICAgICAgICBpZiAoIXNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQsIG5vIGZpbHRlcmluZyBuZWVkZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlID0gJHNjb3BlLmltYWdlcy5pZHM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbWFnZXMuc2VxdWVuY2UgPSBzZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICAvLyB0YWtlIG9ubHkgdGhvc2UgSURzIHRoYXQgYWN0dWFsbHkgYmVsb25nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gSURzIGFyZSB0YWtlbiBmcm9tIGxvY2FsIHN0b3JhZ2UgYnV0IHRoZSB0cmFuc2VjdCBoYXMgY2hhbmdlZClcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoJHNjb3BlLmltYWdlcy5zZXF1ZW5jZSwgJHNjb3BlLmltYWdlcy5pZHMsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSgkc2NvcGUuaW1hZ2VzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LXNlcXVlbmNlJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZEltYWdlRmxhZ3MgPSBmdW5jdGlvbiAobmFtZSwgaWRzLCB0aXRsZSkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlcy5mbGFnc1tuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgIGlkczogaWRzLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlSW1hZ2VGbGFncyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgJHNjb3BlLmltYWdlcy5mbGFnc1tuYW1lXTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0RmxhZ3NGb3IgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgICAgIHZhciBmbGFncyA9ICRzY29wZS5pbWFnZXMuZmxhZ3M7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lIGluIGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzW25hbWVdLmlkcy5pbmRleE9mKGlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZmxhZ3NbbmFtZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGF6eUltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhenkgbG9hZGluZyBpbWFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWFnZScsIGZ1bmN0aW9uICgkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBzY29wZS5lbnF1ZXVlSW1hZ2UoZGVmZXJyZWQucHJvbWlzZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnbG9hZCBlcnJvcicsIGRlZmVycmVkLnJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICBhdHRycy4kc2V0KCdzcmMnLCBhdHRycy5sYXp5SW1hZ2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=