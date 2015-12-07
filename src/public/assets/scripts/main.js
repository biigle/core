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
angular.module('dias.transects').controller('ImagesController', ["$scope", "$element", "$timeout", "$q", "images", function ($scope, $element, $timeout, $q, images) {
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
                images.advance(step);
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				images.advance(step);
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

        $scope.images = images;

        // timeout to wait for all image objects to be present in the DOM
		$timeout(initialize);
        $scope.$on('transects.images.new-ordering', function () {
            $timeout(initialize);
        });

        $scope.$on('transects.images.new-filtering', function () {
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
angular.module('dias.transects').controller('TransectController', ["$scope", "images", "settings", "flags", function ($scope, images, settings, flags) {
		"use strict";

        $scope.settings = settings;

        $scope.flags = flags;

        $scope.progress = function () {
            return {width:  images.progress() * 100 + '%'};
        };

        // set the ordering of the displayed images
        $scope.setImagesSequence = images.reorder;
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

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name flags
 * @memberOf dias.transects
 * @description Service managing the image flags of the transect index page
 */
angular.module('dias.transects').service('flags', ["TRANSECT_ID", "TRANSECT_IMAGES", function (TRANSECT_ID, TRANSECT_IMAGES) {
        "use strict";

        var activeFiltersLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.active_filters';

        var _this = this;
        var flags = {};
        this.list = flags;

        // caches a map of all flags for all images of the transect
        this.cache = {};

        var activeFilters = [];

        // check for a stored active filters
        if (window.localStorage[activeFiltersLocalStorageKey]) {
            activeFilters = JSON.parse(window.localStorage[activeFiltersLocalStorageKey]);
        }

        var getFlagsOfImage = function (id) {
            var output = [];
            for (var flagId in flags) {
                if (flags[flagId].ids.indexOf(id) !== -1) {
                    output.push(flags[flagId]);
                }
            }

            return output;
        };

        var renewCache = function () {
            for (var i = 0; i < TRANSECT_IMAGES.length; i++) {
                _this.cache[TRANSECT_IMAGES[i]] = getFlagsOfImage(TRANSECT_IMAGES[i]);
            }
        };

        var filterIsActive = function (id) {
            return activeFilters.indexOf(id) !== -1;
        };

        /**
         * id: Unique identifier of the flag. Will be added as class of the flag element for each element
         * ids: IDs of the images to be flagged
         * title: Content for the title property of the image flag element
         */
        this.add = function (id, ids, title) {
            flags[id] = {
                cssClass: id,
                ids: ids,
                title: title,
                activeFilter: filterIsActive(id)
            };
            renewCache();
        };

        this.remove = function (id) {
            delete flags[id];
            renewCache();
        };

        this.toggleFilter = function (id) {
            if (filterIsActive(id)) {
                flags[id].activeFilter = false;
                activeFilters.splice(activeFilters.indexOf(id), 1);
            } else {
                flags[id].activeFilter = true;
                activeFilters.push(id);
            }

            window.localStorage[activeFiltersLocalStorageKey] = JSON.stringify(activeFilters);
        };

        this.getActiveFilters = function () {
            var filters = [];
            for (var i = 0; i < activeFilters.length; i++) {
                filters.push(flags[activeFilters[i]].ids);
            }

            return filters;
        };

        this.hasActiveFilters = function () {
            return activeFilters.length > 0;
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', ["$rootScope", "TRANSECT_ID", "TRANSECT_IMAGES", "filterSubset", "flags", function ($rootScope, TRANSECT_ID, TRANSECT_IMAGES, filterSubset, flags) {
        "use strict";

        var _this = this;

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';

        var ordering = [];

        // the currently displayed ordering of images (as array of image IDs)
        this.sequence = [];
        // number of currently shown images
        this.limit = initialLimit;
        // number of overall images
        var length = TRANSECT_IMAGES.length;

        // check for a stored image sorting sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            _this.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(_this.sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, _this.sequence);
        }

        var updateSequence = function () {
            if (ordering.length === 0) {
                // reset, no filtering needed
                angular.copy(TRANSECT_IMAGES, _this.sequence);
            } else {
                angular.copy(ordering, _this.sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(_this.sequence, TRANSECT_IMAGES, true);
            }

            var filters = flags.getActiveFilters();

            for (var i = 0; i < filters.length; i++) {
                filterSubset(_this.sequence, filters[i]);
            }

            window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
        };

        this.progress = function () {
            return length > 0 ? Math.min(_this.limit / length, 1) : 0;
        };

        this.reorder = function (ids) {
            ordering = Array.isArray(ids) ? ids : [];
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-ordering');
        };

        this.toggleFilter = function (id) {
            flags.toggleFilter(id);
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-filtering');
        };

        this.advance = function (step) {
            _this.limit += step;
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name settings
 * @memberOf dias.transects
 * @description Service managing the settings of the transect index page
 */
angular.module('dias.transects').service('settings', function () {
        "use strict";

        var settingsLocalStorageKey = 'dias.transects.settings';

        // client-side (default) settings for all transect index pages
        var settings = {
            'show-flags': true
        };

        // extend/override default settings with local ones
        if (window.localStorage[settingsLocalStorageKey]) {
            angular.extend(settings, JSON.parse(window.localStorage[settingsLocalStorageKey]));
        }

        this.set = function (key, value) {
            settings[key] = value;
            window.localStorage[settingsLocalStorageKey] = JSON.stringify(settings);
        };

        this.get = function (key) {
            return settings[key];
        };
    }
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiLCJzZXJ2aWNlcy9mbGFncy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUEsWUFBQTs7Ozs7Ozs7OztBQ0lBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsUUFBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFB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UUFBQTs7UUFFQSxJQUFBLFNBQUEsZ0JBQUE7OztRQUdBLElBQUEsT0FBQSxhQUFBLHdCQUFBO1lBQ0EsTUFBQSxXQUFBLEtBQUEsTUFBQSxPQUFBLGFBQUE7OztZQUdBLGFBQUEsTUFBQSxVQUFBLGlCQUFBO2VBQ0E7WUFDQSxRQUFBLEtBQUEsaUJBQUEsTUFBQTs7O1FBR0EsSUFBQSxpQkFBQSxZQUFBO1lBQ0EsSUFBQSxTQUFBLFdBQUEsR0FBQTs7Z0JBRUEsUUFBQSxLQUFBLGlCQUFBLE1BQUE7bUJBQ0E7Z0JBQ0EsUUFBQSxLQUFBLFVBQUEsTUFBQTs7O2dCQUdBLGFBQUEsTUFBQSxVQUFBLGlCQUFBOzs7WUFHQSxJQUFBLFVBQUEsTUFBQTs7WUFFQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsUUFBQSxRQUFBLEtBQUE7Z0JBQ0EsYUFBQSxNQUFBLFVBQUEsUUFBQTs7O1lBR0EsT0FBQSxhQUFBLHlCQUFBLEtBQUEsVUFBQSxNQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUEsU0FBQSxJQUFBLEtBQUEsSUFBQSxNQUFBLFFBQUEsUUFBQSxLQUFBOzs7UUFHQSxLQUFBLFVBQUEsVUFBQSxLQUFBO1lBQ0EsV0FBQSxNQUFBLFFBQUEsT0FBQSxNQUFBO1lBQ0E7O1lBRUEsTUFBQSxRQUFBO1lBQ0EsV0FBQSxXQUFBOzs7UUFHQSxLQUFBLGVBQUEsVUFBQSxJQUFBO1lBQ0EsTUFBQSxhQUFBO1lBQ0E7O1lBRUEsTUFBQSxRQUFBO1lBQ0EsV0FBQSxXQUFBOzs7UUFHQSxLQUFBLFVBQUEsVUFBQSxNQUFBO1lBQ0EsTUFBQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN0RUEsUUFBQSxPQUFBLGtCQUFBLFFBQUEsWUFBQSxZQUFBO1FBQ0E7O1FBRUEsSUFBQSwwQkFBQTs7O1FBR0EsSUFBQSxXQUFBO1lBQ0EsY0FBQTs7OztRQUlBLElBQUEsT0FBQSxhQUFBLDBCQUFBO1lBQ0EsUUFBQSxPQUFBLFVBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsU0FBQSxPQUFBO1lBQ0EsT0FBQSxhQUFBLDJCQUFBLEtBQUEsVUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQTtZQUNBLE9BQUEsU0FBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBkaXNwbGF5aW5nIHRoZSBodWdlIGFtb3V0IG9mIGltYWdlcyBvZiBhXG4gKiB0cmFuc2VjdCBvbiBhIHNpbmdlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJHRpbWVvdXQsICRxLCBpbWFnZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbWFueSBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcbiAgICAgICAgICAgICAgICBpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdGltYWdlcy5hZHZhbmNlKHN0ZXApO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gaW5pdGlhdGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBpZiB0aGVyZSBhcmUgc3RpbGwgdW51c2VkIHBhcmFsbGVsIGNvbm5lY3Rpb25zXG4gICAgICAgIHZhciBtYXliZUxvYWROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRseUxvYWRpbmcgPCBwYXJhbGxlbENvbm5lY3Rpb25zICYmIGxvYWRTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZysrO1xuICAgICAgICAgICAgICAgIGxvYWRTdGFjay5wb3AoKS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugc2hvdWxkIGxvYWRcbiAgICAgICAgLy8gZ2V0cyBhIHByb21pc2UgYXMgYXJnaW1lbnQgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICRzY29wZS5lbnF1ZXVlSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VMb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIFwic2hvdWxkIGxvYWRcIiBwcm9taXNlIHRvIHRoZSBzdGFja1xuICAgICAgICAgICAgbG9hZFN0YWNrLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2VucXVldWVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpbWFnZUxvYWRlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gbG9hZCB0aGUgbmV4dCBpbWFnZSBpbiB0aGUgc3RhY2tcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nLS07XG4gICAgICAgICAgICAgICAgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudGx5TG9hZGluZyA9PT0gMCkgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcblxuICAgICAgICAvLyB0aW1lb3V0IHRvIHdhaXQgZm9yIGFsbCBpbWFnZSBvYmplY3RzIHRvIGJlIHByZXNlbnQgaW4gdGhlIERPTVxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1vcmRlcmluZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCBzZXR0aW5ncywgZmxhZ3MpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBzZXR0aW5ncztcblxuICAgICAgICAkc2NvcGUuZmxhZ3MgPSBmbGFncztcblxuICAgICAgICAkc2NvcGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3dpZHRoOiAgaW1hZ2VzLnByb2dyZXNzKCkgKiAxMDAgKyAnJSd9O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNldCB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpc3BsYXllZCBpbWFnZXNcbiAgICAgICAgJHNjb3BlLnNldEltYWdlc1NlcXVlbmNlID0gaW1hZ2VzLnJlb3JkZXI7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgZmxhZ3NcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIGltYWdlIGZsYWdzIG9mIHRoZSB0cmFuc2VjdCBpbmRleCBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ2ZsYWdzJywgZnVuY3Rpb24gKFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGFjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5hY3RpdmVfZmlsdGVycyc7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZsYWdzID0ge307XG4gICAgICAgIHRoaXMubGlzdCA9IGZsYWdzO1xuXG4gICAgICAgIC8vIGNhY2hlcyBhIG1hcCBvZiBhbGwgZmxhZ3MgZm9yIGFsbCBpbWFnZXMgb2YgdGhlIHRyYW5zZWN0XG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcblxuICAgICAgICB2YXIgYWN0aXZlRmlsdGVycyA9IFtdO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBhY3RpdmUgZmlsdGVyc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYWN0aXZlRmlsdGVycyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ2V0RmxhZ3NPZkltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBmbGFnSWQgaW4gZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3NbZmxhZ0lkXS5pZHMuaW5kZXhPZihpZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGZsYWdzW2ZsYWdJZF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVuZXdDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVFJBTlNFQ1RfSU1BR0VTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2FjaGVbVFJBTlNFQ1RfSU1BR0VTW2ldXSA9IGdldEZsYWdzT2ZJbWFnZShUUkFOU0VDVF9JTUFHRVNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaWx0ZXJJc0FjdGl2ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlcnMuaW5kZXhPZihpZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBpZDogVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGZsYWcuIFdpbGwgYmUgYWRkZWQgYXMgY2xhc3Mgb2YgdGhlIGZsYWcgZWxlbWVudCBmb3IgZWFjaCBlbGVtZW50XG4gICAgICAgICAqIGlkczogSURzIG9mIHRoZSBpbWFnZXMgdG8gYmUgZmxhZ2dlZFxuICAgICAgICAgKiB0aXRsZTogQ29udGVudCBmb3IgdGhlIHRpdGxlIHByb3BlcnR5IG9mIHRoZSBpbWFnZSBmbGFnIGVsZW1lbnRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYWRkID0gZnVuY3Rpb24gKGlkLCBpZHMsIHRpdGxlKSB7XG4gICAgICAgICAgICBmbGFnc1tpZF0gPSB7XG4gICAgICAgICAgICAgICAgY3NzQ2xhc3M6IGlkLFxuICAgICAgICAgICAgICAgIGlkczogaWRzLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgICAgICBhY3RpdmVGaWx0ZXI6IGZpbHRlcklzQWN0aXZlKGlkKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlbmV3Q2FjaGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZGVsZXRlIGZsYWdzW2lkXTtcbiAgICAgICAgICAgIHJlbmV3Q2FjaGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcklzQWN0aXZlKGlkKSkge1xuICAgICAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBhY3RpdmVGaWx0ZXJzLnNwbGljZShhY3RpdmVGaWx0ZXJzLmluZGV4T2YoaWQpLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxhZ3NbaWRdLmFjdGl2ZUZpbHRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVycy5wdXNoKGlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KGFjdGl2ZUZpbHRlcnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWN0aXZlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGl2ZUZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goZmxhZ3NbYWN0aXZlRmlsdGVyc1tpXV0uaWRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNBY3RpdmVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlcnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBsaXN0IG9mIGltYWdlcyB0byBkaXNwbGF5XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTLCBmaWx0ZXJTdWJzZXQsIGZsYWdzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGluaXRpYWxseSBzaG93biBpbWFnZXNcbiAgICAgICAgdmFyIGluaXRpYWxMaW1pdCA9IDIwO1xuXG4gICAgICAgIHZhciBpbWFnZXNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnO1xuXG4gICAgICAgIHZhciBvcmRlcmluZyA9IFtdO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50bHkgZGlzcGxheWVkIG9yZGVyaW5nIG9mIGltYWdlcyAoYXMgYXJyYXkgb2YgaW1hZ2UgSURzKVxuICAgICAgICB0aGlzLnNlcXVlbmNlID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBjdXJyZW50bHkgc2hvd24gaW1hZ2VzXG4gICAgICAgIHRoaXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICB2YXIgbGVuZ3RoID0gVFJBTlNFQ1RfSU1BR0VTLmxlbmd0aDtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgaW1hZ2Ugc29ydGluZyBzZXF1ZW5jZVxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBfdGhpcy5zZXF1ZW5jZSA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBpbWFnZXMgbG9hZGVkIGZyb20gc3RvcmFnZSBhcmUgc3RpbGwgdGhlcmUgaW4gdGhlIHRyYW5zZWN0LlxuICAgICAgICAgICAgLy8gc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZCBpbiB0aGUgbWVhbnRpbWUuXG4gICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIFRSQU5TRUNUX0lNQUdFUywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbmd1bGFyLmNvcHkoVFJBTlNFQ1RfSU1BR0VTLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdXBkYXRlU2VxdWVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAob3JkZXJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQsIG5vIGZpbHRlcmluZyBuZWVkZWRcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkoVFJBTlNFQ1RfSU1BR0VTLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShvcmRlcmluZywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgICAgIC8vIHRha2Ugb25seSB0aG9zZSBJRHMgdGhhdCBhY3R1YWxseSBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiBJRHMgYXJlIHRha2VuIGZyb20gbG9jYWwgc3RvcmFnZSBidXQgdGhlIHRyYW5zZWN0IGhhcyBjaGFuZ2VkKVxuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgVFJBTlNFQ1RfSU1BR0VTLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBmbGFncy5nZXRBY3RpdmVGaWx0ZXJzKCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgZmlsdGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxlbmd0aCA+IDAgPyBNYXRoLm1pbihfdGhpcy5saW1pdCAvIGxlbmd0aCwgMSkgOiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVvcmRlciA9IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgICAgIG9yZGVyaW5nID0gQXJyYXkuaXNBcnJheShpZHMpID8gaWRzIDogW107XG4gICAgICAgICAgICB1cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1vcmRlcmluZycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmbGFncy50b2dnbGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgdXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICBfdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctZmlsdGVyaW5nJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ICs9IHN0ZXA7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHNldHRpbmdzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBzZXR0aW5ncyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdzZXR0aW5ncycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLnNldHRpbmdzJztcblxuICAgICAgICAvLyBjbGllbnQtc2lkZSAoZGVmYXVsdCkgc2V0dGluZ3MgZm9yIGFsbCB0cmFuc2VjdCBpbmRleCBwYWdlc1xuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAnc2hvdy1mbGFncyc6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBleHRlbmQvb3ZlcnJpZGUgZGVmYXVsdCBzZXR0aW5ncyB3aXRoIGxvY2FsIG9uZXNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShzZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9