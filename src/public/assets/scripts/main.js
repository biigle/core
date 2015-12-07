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
angular.module('dias.transects').controller('TransectController', ["$scope", "images", "settings", "flags", function ($scope, images, settings, flags) {
		"use strict";

        $scope.settings = settings;

        $scope.flags = flags;

        $scope.progress = function () {
            return {width:  images.progress() * 100 + '%'};
        };

        // set the ordering of the displayed images
        $scope.setImagesSequence = function (sequence) {
            images.reorder(sequence);
            $scope.$broadcast('transects.images.new-sequence');
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
angular.module('dias.transects').service('images', ["TRANSECT_ID", "TRANSECT_IMAGES", "filterSubset", "flags", function (TRANSECT_ID, TRANSECT_IMAGES, filterSubset, flags) {
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
            return _this.length ? Math.min(_this.limit / _this.length, 1) : 0;
        };

        this.reorder = function (ids) {
            ordering = Array.isArray(ids) ? ids : [];
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
        };

        this.toggleFilter = function (id) {
            flags.toggleFilter(id);
            updateSequence();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiLCJzZXJ2aWNlcy9mbGFncy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUEsWUFBQTs7Ozs7Ozs7OztBQ0lBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsUUFBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFB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QUVBLElBQUEsU0FBQSxnQkFBQTs7O1FBR0EsSUFBQSxPQUFBLGFBQUEsd0JBQUE7WUFDQSxNQUFBLFdBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1lBR0EsYUFBQSxNQUFBLFVBQUEsaUJBQUE7ZUFDQTtZQUNBLFFBQUEsS0FBQSxpQkFBQSxNQUFBOzs7UUFHQSxJQUFBLGlCQUFBLFlBQUE7WUFDQSxJQUFBLFNBQUEsV0FBQSxHQUFBOztnQkFFQSxRQUFBLEtBQUEsaUJBQUEsTUFBQTttQkFDQTtnQkFDQSxRQUFBLEtBQUEsVUFBQSxNQUFBOzs7Z0JBR0EsYUFBQSxNQUFBLFVBQUEsaUJBQUE7OztZQUdBLElBQUEsVUFBQSxNQUFBOztZQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxRQUFBLFFBQUEsS0FBQTtnQkFDQSxhQUFBLE1BQUEsVUFBQSxRQUFBOzs7WUFHQSxPQUFBLGFBQUEseUJBQUEsS0FBQSxVQUFBLE1BQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQSxNQUFBLFNBQUEsS0FBQSxJQUFBLE1BQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTs7O1FBR0EsS0FBQSxVQUFBLFVBQUEsS0FBQTtZQUNBLFdBQUEsTUFBQSxRQUFBLE9BQUEsTUFBQTtZQUNBOztZQUVBLE1BQUEsUUFBQTs7O1FBR0EsS0FBQSxlQUFBLFVBQUEsSUFBQTtZQUNBLE1BQUEsYUFBQTtZQUNBOzs7UUFHQSxLQUFBLFVBQUEsVUFBQSxNQUFBO1lBQ0EsTUFBQSxTQUFBOzs7Ozs7Ozs7Ozs7QUNsRUEsUUFBQSxPQUFBLGtCQUFBLFFBQUEsWUFBQSxZQUFBO1FBQ0E7O1FBRUEsSUFBQSwwQkFBQTs7O1FBR0EsSUFBQSxXQUFBO1lBQ0EsY0FBQTs7OztRQUlBLElBQUEsT0FBQSxhQUFBLDBCQUFBO1lBQ0EsUUFBQSxPQUFBLFVBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsU0FBQSxPQUFBO1lBQ0EsT0FBQSxhQUFBLDJCQUFBLEtBQUEsVUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQTtZQUNBLE9BQUEsU0FBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBJbWFnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBkaXNwbGF5aW5nIHRoZSBodWdlIGFtb3V0IG9mIGltYWdlcyBvZiBhXG4gKiB0cmFuc2VjdCBvbiBhIHNpbmdlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0ltYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCwgJHRpbWVvdXQsICRxLCBpbWFnZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbWFueSBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcbiAgICAgICAgICAgICAgICBpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG5cdFx0XHRcdGltYWdlcy5hZHZhbmNlKHN0ZXApO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gaW5pdGlhdGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBpZiB0aGVyZSBhcmUgc3RpbGwgdW51c2VkIHBhcmFsbGVsIGNvbm5lY3Rpb25zXG4gICAgICAgIHZhciBtYXliZUxvYWROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRseUxvYWRpbmcgPCBwYXJhbGxlbENvbm5lY3Rpb25zICYmIGxvYWRTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZysrO1xuICAgICAgICAgICAgICAgIGxvYWRTdGFjay5wb3AoKS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugc2hvdWxkIGxvYWRcbiAgICAgICAgLy8gZ2V0cyBhIHByb21pc2UgYXMgYXJnaW1lbnQgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICRzY29wZS5lbnF1ZXVlSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VMb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIFwic2hvdWxkIGxvYWRcIiBwcm9taXNlIHRvIHRoZSBzdGFja1xuICAgICAgICAgICAgbG9hZFN0YWNrLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2VucXVldWVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpbWFnZUxvYWRlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gbG9hZCB0aGUgbmV4dCBpbWFnZSBpbiB0aGUgc3RhY2tcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nLS07XG4gICAgICAgICAgICAgICAgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudGx5TG9hZGluZyA9PT0gMCkgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcblxuICAgICAgICAvLyB0aW1lb3V0IHRvIHdhaXQgZm9yIGFsbCBpbWFnZSBvYmplY3RzIHRvIGJlIHByZXNlbnQgaW4gdGhlIERPTVxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1zZXF1ZW5jZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFRyYW5zZWN0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gR2xvYmFsIGNvbnRyb2xsZXIgZm9yIHRoZSB0cmFuc2VjdHMgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHNldHRpbmdzLCBmbGFncykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHNldHRpbmdzO1xuXG4gICAgICAgICRzY29wZS5mbGFncyA9IGZsYWdzO1xuXG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7d2lkdGg6ICBpbWFnZXMucHJvZ3Jlc3MoKSAqIDEwMCArICclJ307XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2V0IHRoZSBvcmRlcmluZyBvZiB0aGUgZGlzcGxheWVkIGltYWdlc1xuICAgICAgICAkc2NvcGUuc2V0SW1hZ2VzU2VxdWVuY2UgPSBmdW5jdGlvbiAoc2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGltYWdlcy5yZW9yZGVyKHNlcXVlbmNlKTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1zZXF1ZW5jZScpO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYXp5SW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgbGF6eSBsb2FkaW5nIGltYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmRpcmVjdGl2ZSgnbGF6eUltYWdlJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHNjb3BlLmVucXVldWVJbWFnZShkZWZlcnJlZC5wcm9taXNlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdsb2FkIGVycm9yJywgZGVmZXJyZWQucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLiRzZXQoJ3NyYycsIGF0dHJzLmxhenlJbWFnZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGZsYWdzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBpbWFnZSBmbGFncyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdmbGFncycsIGZ1bmN0aW9uIChUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuYWN0aXZlX2ZpbHRlcnMnO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmxpc3QgPSBmbGFncztcblxuICAgICAgICAvLyBjYWNoZXMgYSBtYXAgb2YgYWxsIGZsYWdzIGZvciBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdFxuICAgICAgICB0aGlzLmNhY2hlID0ge307XG5cbiAgICAgICAgdmFyIGFjdGl2ZUZpbHRlcnMgPSBbXTtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgYWN0aXZlIGZpbHRlcnNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdldEZsYWdzT2ZJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZmxhZ0lkIGluIGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzW2ZsYWdJZF0uaWRzLmluZGV4T2YoaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChmbGFnc1tmbGFnSWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlbmV3Q2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRSQU5TRUNUX0lNQUdFUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF90aGlzLmNhY2hlW1RSQU5TRUNUX0lNQUdFU1tpXV0gPSBnZXRGbGFnc09mSW1hZ2UoVFJBTlNFQ1RfSU1BR0VTW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZmlsdGVySXNBY3RpdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmluZGV4T2YoaWQpICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogaWQ6IFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBmbGFnLiBXaWxsIGJlIGFkZGVkIGFzIGNsYXNzIG9mIHRoZSBmbGFnIGVsZW1lbnQgZm9yIGVhY2ggZWxlbWVudFxuICAgICAgICAgKiBpZHM6IElEcyBvZiB0aGUgaW1hZ2VzIHRvIGJlIGZsYWdnZWRcbiAgICAgICAgICogdGl0bGU6IENvbnRlbnQgZm9yIHRoZSB0aXRsZSBwcm9wZXJ0eSBvZiB0aGUgaW1hZ2UgZmxhZyBlbGVtZW50XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChpZCwgaWRzLCB0aXRsZSkge1xuICAgICAgICAgICAgZmxhZ3NbaWRdID0ge1xuICAgICAgICAgICAgICAgIGNzc0NsYXNzOiBpZCxcbiAgICAgICAgICAgICAgICBpZHM6IGlkcyxcbiAgICAgICAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVyOiBmaWx0ZXJJc0FjdGl2ZShpZClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBmbGFnc1tpZF07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJJc0FjdGl2ZShpZCkpIHtcbiAgICAgICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlRmlsdGVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVycy5zcGxpY2UoYWN0aXZlRmlsdGVycy5pbmRleE9mKGlkKSwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMucHVzaChpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFjdGl2ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3RpdmVGaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGZsYWdzW2FjdGl2ZUZpbHRlcnNbaV1dLmlkcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzQWN0aXZlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGltYWdlc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgbGlzdCBvZiBpbWFnZXMgdG8gZGlzcGxheVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdpbWFnZXMnLCBmdW5jdGlvbiAoVFJBTlNFQ1RfSUQsIFRSQU5TRUNUX0lNQUdFUywgZmlsdGVyU3Vic2V0LCBmbGFncykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBpbml0aWFsbHkgc2hvd24gaW1hZ2VzXG4gICAgICAgIHZhciBpbml0aWFsTGltaXQgPSAyMDtcblxuICAgICAgICB2YXIgaW1hZ2VzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJztcblxuICAgICAgICB2YXIgb3JkZXJpbmcgPSBbXTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IGRpc3BsYXllZCBvcmRlcmluZyBvZiBpbWFnZXMgKGFzIGFycmF5IG9mIGltYWdlIElEcylcbiAgICAgICAgdGhpcy5zZXF1ZW5jZSA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICB0aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAvLyBudW1iZXIgb2Ygb3ZlcmFsbCBpbWFnZXNcbiAgICAgICAgdmFyIGxlbmd0aCA9IFRSQU5TRUNUX0lNQUdFUy5sZW5ndGg7XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgc3RvcmVkIGltYWdlIHNvcnRpbmcgc2VxdWVuY2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgX3RoaXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgIC8vIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVwZGF0ZVNlcXVlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG9yZGVyaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIHJlc2V0LCBubyBmaWx0ZXJpbmcgbmVlZGVkXG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkob3JkZXJpbmcsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAvLyB0YWtlIG9ubHkgdGhvc2UgSURzIHRoYXQgYWN0dWFsbHkgYmVsb25nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gSURzIGFyZSB0YWtlbiBmcm9tIGxvY2FsIHN0b3JhZ2UgYnV0IHRoZSB0cmFuc2VjdCBoYXMgY2hhbmdlZClcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIFRSQU5TRUNUX0lNQUdFUywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gZmxhZ3MuZ2V0QWN0aXZlRmlsdGVycygpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIGZpbHRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5sZW5ndGggPyBNYXRoLm1pbihfdGhpcy5saW1pdCAvIF90aGlzLmxlbmd0aCwgMSkgOiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVvcmRlciA9IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgICAgIG9yZGVyaW5nID0gQXJyYXkuaXNBcnJheShpZHMpID8gaWRzIDogW107XG4gICAgICAgICAgICB1cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmbGFncy50b2dnbGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgdXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICAgICAgX3RoaXMubGltaXQgKz0gc3RlcDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc2V0dGluZ3NcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIHNldHRpbmdzIG9mIHRoZSB0cmFuc2VjdCBpbmRleCBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ3NldHRpbmdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuc2V0dGluZ3MnO1xuXG4gICAgICAgIC8vIGNsaWVudC1zaWRlIChkZWZhdWx0KSBzZXR0aW5ncyBmb3IgYWxsIHRyYW5zZWN0IGluZGV4IHBhZ2VzXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICdzaG93LWZsYWdzJzogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGV4dGVuZC9vdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzIHdpdGggbG9jYWwgb25lc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHNldHRpbmdzLCBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBzZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=