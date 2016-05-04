/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.transects').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.transects').controller('FilterController', ["$scope", "images", "TRANSECT_IMAGES", function ($scope, images, TRANSECT_IMAGES) {
		"use strict";

        $scope.totalNoImages = TRANSECT_IMAGES.length;

        var update = function () {
            $scope.currentNoImages = images.length;
        };

        $scope.$on('transects.images.new-filtering', update);
        update();
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
			if (needsNewStep() && images.limit <= images.length) {
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
            loadStack.length = 0;
            currentlyLoading = 0;
            $timeout(initialize);
        });

        $scope.$on('transects.images.new-filtering', function () {
            loadStack.length = 0;
            currentlyLoading = 0;
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
        var activeNegateFiltersLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.active_negate_filters';

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

        var activeNegateFilters = [];

        // check for a stored active negate filters
        if (window.localStorage[activeNegateFiltersLocalStorageKey]) {
            activeNegateFilters = JSON.parse(window.localStorage[activeNegateFiltersLocalStorageKey]);
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

        var negateFilterIsActive = function (id) {
            return activeNegateFilters.indexOf(id) !== -1;
        };

        var activateFilter = function (id) {
            flags[id].activeFilter = true;
            activeFilters.push(id);
            window.localStorage[activeFiltersLocalStorageKey] = JSON.stringify(activeFilters);
        };

        var deactivateFilter = function (id) {
            var index = activeFilters.indexOf(id);
            if (index === -1) return;
            flags[id].activeFilter = false;
            activeFilters.splice(index, 1);
            window.localStorage[activeFiltersLocalStorageKey] = JSON.stringify(activeFilters);
        };

        var activateNegateFilter = function (id) {
            flags[id].activeNegateFilter = true;
            activeNegateFilters.push(id);
            window.localStorage[activeNegateFiltersLocalStorageKey] = JSON.stringify(activeNegateFilters);
        };

        var deactivateNegateFilter = function (id) {
            var index = activeNegateFilters.indexOf(id);
            if (index === -1) return;
            flags[id].activeNegateFilter = false;
            activeNegateFilters.splice(index, 1);
            window.localStorage[activeNegateFiltersLocalStorageKey] = JSON.stringify(activeNegateFilters);
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
                activeFilter: filterIsActive(id),
                activeNegateFilter: negateFilterIsActive(id)
            };
            renewCache();
        };

        this.remove = function (id) {
            delete flags[id];
            renewCache();
        };

        this.toggleFilter = function (id) {
            if (!flags.hasOwnProperty(id)) return;

            if (filterIsActive(id)) {
                deactivateFilter(id);
            } else {
                activateFilter(id);
            }

            deactivateNegateFilter(id);
        };

        this.toggleNegateFilter = function (id) {
            if (!flags.hasOwnProperty(id)) return;

            if (negateFilterIsActive(id)) {
                deactivateNegateFilter(id);
            } else {
                activateNegateFilter(id);
            }
            deactivateFilter(id);
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

        this.getActiveNegateFilters = function () {
            var filters = [];
            for (var i = 0; i < activeNegateFilters.length; i++) {
                filters.push(flags[activeNegateFilters[i]].ids);
            }

            return filters;
        };

        this.hasActiveNegateFilters = function () {
            return activeNegateFilters.length > 0;
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
angular.module('dias.transects').service('images', ["$rootScope", "TRANSECT_ID", "TRANSECT_IMAGES", "filterSubset", "filterExclude", "flags", function ($rootScope, TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filterExclude, flags) {
        "use strict";

        var _this = this;

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';
        var orderingLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.ordering';

        var ordering = [];

        // the currently displayed ordering of images (as array of image IDs)
        this.sequence = [];
        // number of currently shown images
        this.limit = initialLimit;

        // check for a stored image sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            _this.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(_this.sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, _this.sequence);
        }

        // check for a stored image ordering
        if (window.localStorage[orderingLocalStorageKey]) {
            ordering = JSON.parse(window.localStorage[orderingLocalStorageKey]);
        }

        // number of overall images
        this.length = this.sequence.length;

        var updateSequence = function () {
            var shouldStore = false;
            if (ordering.length === 0) {
                angular.copy(TRANSECT_IMAGES, _this.sequence);
            } else {
                shouldStore = true;
                angular.copy(ordering, _this.sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(_this.sequence, TRANSECT_IMAGES, true);
            }

            var filters = flags.getActiveFilters();

            for (var i = 0; i < filters.length; i++) {
                shouldStore = true;
                filterSubset(_this.sequence, filters[i]);
            }


            filters = flags.getActiveNegateFilters();

            for (i = 0; i < filters.length; i++) {
                shouldStore = true;
                filterExclude(_this.sequence, filters[i]);
            }


            _this.length = _this.sequence.length;

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }
        };

        var updateFiltering = function () {
            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-filtering');
        };

        this.progress = function () {
            return _this.length > 0 ? Math.min(_this.limit / _this.length, 1) : 0;
        };

        this.reorder = function (ids) {
            ordering = Array.isArray(ids) ? ids : [];
            if (ordering.length > 0) {
                window.localStorage[orderingLocalStorageKey] = JSON.stringify(ordering);
            } else {
                // dont save the ordering if it equals the TRANSECT_IMAGES
                window.localStorage.removeItem(orderingLocalStorageKey);
            }

            updateSequence();
            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.new-ordering');
        };

        this.toggleFilter = function (id) {
            flags.toggleFilter(id);
            updateFiltering();
        };

        this.toggleNegateFilter = function (id) {
            flags.toggleNegateFilter(id);
            updateFiltering();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9GaWx0ZXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvSW1hZ2VzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1RyYW5zZWN0Q29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvbGF6eUltYWdlLmpzIiwic2VydmljZXMvZmxhZ3MuanMiLCJzZXJ2aWNlcy9pbWFnZXMuanMiLCJzZXJ2aWNlcy9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxrQkFBQSxDQUFBLFlBQUE7Ozs7OztBQU1BLFFBQUEsT0FBQSxrQkFBQSw0QkFBQSxVQUFBLGtCQUFBO0lBQ0E7O0lBRUEsaUJBQUEsaUJBQUE7Ozs7Ozs7Ozs7QUNOQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSw0REFBQSxVQUFBLFFBQUEsUUFBQSxpQkFBQTtFQUNBOztRQUVBLE9BQUEsZ0JBQUEsZ0JBQUE7O1FBRUEsSUFBQSxTQUFBLFlBQUE7WUFDQSxPQUFBLGtCQUFBLE9BQUE7OztRQUdBLE9BQUEsSUFBQSxrQ0FBQTtRQUNBOzs7Ozs7Ozs7Ozs7QUNUQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSx1RUFBQSxVQUFBLFFBQUEsVUFBQSxVQUFBLElBQUEsUUFBQTtFQUNBOztFQUVBLElBQUEsVUFBQSxTQUFBO0VBQ0EsSUFBQSxjQUFBOztFQUVBLElBQUEsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQTs7UUFFQSxJQUFBLHNCQUFBOztRQUVBLElBQUEsWUFBQTs7UUFFQSxJQUFBLG1CQUFBOztFQUVBLElBQUEsZUFBQSxZQUFBO0dBQ0EsZUFBQSxRQUFBO0dBQ0EsT0FBQSxRQUFBLGFBQUEsUUFBQSxlQUFBLFFBQUEsZUFBQTs7O0VBR0EsSUFBQSxrQkFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtnQkFDQSxPQUFBLFFBQUE7SUFDQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLGFBQUEsWUFBQTtHQUNBLElBQUEsa0JBQUEsT0FB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QSxTQUFBOzs7O0FBSUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHRyYW5zZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcblxuLypcbiAqIERpc2FibGUgZGVidWcgaW5mbyBpbiBwcm9kdWN0aW9uIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gKiBzZWU6IGh0dHBzOi8vY29kZS5hbmd1bGFyanMub3JnLzEuNC43L2RvY3MvZ3VpZGUvcHJvZHVjdGlvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb25maWcoZnVuY3Rpb24gKCRjb21waWxlUHJvdmlkZXIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICRjb21waWxlUHJvdmlkZXIuZGVidWdJbmZvRW5hYmxlZChmYWxzZSk7XG59KTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEZpbHRlckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBmaWx0ZXIgZmVhdHVyZSBvZiB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignRmlsdGVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgVFJBTlNFQ1RfSU1BR0VTKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnRvdGFsTm9JbWFnZXMgPSBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoO1xuXG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudE5vSW1hZ2VzID0gaW1hZ2VzLmxlbmd0aDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnLCB1cGRhdGUpO1xuICAgICAgICB1cGRhdGUoKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEltYWdlc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmcgdGhlIGh1Z2UgYW1vdXQgb2YgaW1hZ2VzIG9mIGFcbiAqIHRyYW5zZWN0IG9uIGEgc2luZ2UgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignSW1hZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkdGltZW91dCwgJHEsIGltYWdlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSAkZWxlbWVudFswXTtcblx0XHR2YXIgYm91bmRpbmdSZWN0LCB0aW1lb3V0UHJvbWlzZTtcblx0XHQvLyBhZGQgdGhpcyBtYW55IGltYWdlcyBmb3IgZWFjaCBzdGVwXG5cdFx0dmFyIHN0ZXAgPSAyMDtcblx0XHQvLyBvZmZzZXQgb2YgdGhlIGVsZW1lbnQgYm90dG9tIHRvIHRoZSB3aW5kb3cgbG93ZXIgYm91bmQgaW4gcGl4ZWxzIGF0XG5cdFx0Ly8gd2hpY2ggYSBuZXcgYnVuY2ggb2YgaW1hZ2VzIHNob3VsZCBiZSBkaXNwbGF5ZWRcblx0XHR2YXIgbmV3U3RlcE9mZnNldCA9IDEwMDtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGltYWdlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGxvYWQgaW4gcGFyYWxsZWxcbiAgICAgICAgdmFyIHBhcmFsbGVsQ29ubmVjdGlvbnMgPSAxMDtcbiAgICAgICAgLy8gc3RvcmVzIHRoZSBwcm9taXNlcyBvZiB0aGUgaW1hZ2VzIHRoYXQgd2FudCB0byBsb2FkXG4gICAgICAgIHZhciBsb2FkU3RhY2sgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGltYWdlcyB0aGF0IGFyZSBjdXJyZW50bHkgbG9hZGluZ1xuICAgICAgICB2YXIgY3VycmVudGx5TG9hZGluZyA9IDA7XG5cblx0XHR2YXIgbmVlZHNOZXdTdGVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ym91bmRpbmdSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdHJldHVybiBlbGVtZW50LnNjcm9sbFRvcCA+PSBlbGVtZW50LnNjcm9sbEhlaWdodCAtIGVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gbmV3U3RlcE9mZnNldDtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrTG93ZXJCb3VuZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuICAgICAgICAgICAgICAgIGltYWdlcy5hZHZhbmNlKHN0ZXApO1xuXHRcdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGF0dGVtcHRzIHRvIGZpbGwgdGhlIGN1cnJlbnQgdmlld3BvcnQgd2l0aCBpbWFnZXNcblx0XHQvLyB1c2VzICR0aW1lb3V0IHRvIHdhaXQgZm9yIERPTSByZW5kZXJpbmcsIHRoZW4gY2hlY2tzIGFnYWluXG5cdFx0dmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkgJiYgaW1hZ2VzLmxpbWl0IDw9IGltYWdlcy5sZW5ndGgpIHtcblx0XHRcdFx0aW1hZ2VzLmFkdmFuY2Uoc3RlcCk7XG5cdFx0XHRcdHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoaW5pdGlhbGl6ZSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGlzIGZ1bGwsIG5vdyBzd2l0Y2ggdG8gZXZlbnQgbGlzdGVuZXJzIGZvciBsb2FkaW5nXG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBpbml0aWF0ZSBsb2FkaW5nIG9mIHRoZSBuZXh0IGltYWdlIGlmIHRoZXJlIGFyZSBzdGlsbCB1bnVzZWQgcGFyYWxsZWwgY29ubmVjdGlvbnNcbiAgICAgICAgdmFyIG1heWJlTG9hZE5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudGx5TG9hZGluZyA8IHBhcmFsbGVsQ29ubmVjdGlvbnMgJiYgbG9hZFN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nKys7XG4gICAgICAgICAgICAgICAgbG9hZFN0YWNrLnBvcCgpLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugc2hvdWxkIGxvYWRcbiAgICAgICAgLy8gZ2V0cyBhIHByb21pc2UgYXMgYXJnaW1lbnQgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICRzY29wZS5lbnF1ZXVlSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VMb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIFwic2hvdWxkIGxvYWRcIiBwcm9taXNlIHRvIHRoZSBzdGFja1xuICAgICAgICAgICAgbG9hZFN0YWNrLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2VucXVldWVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpbWFnZUxvYWRlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGVkJywgbG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gbG9hZCB0aGUgbmV4dCBpbWFnZSBpbiB0aGUgc3RhY2tcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nLS07XG4gICAgICAgICAgICAgICAgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudGx5TG9hZGluZyA9PT0gMCkgbWF5YmVMb2FkTmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcblxuICAgICAgICAvLyB0aW1lb3V0IHRvIHdhaXQgZm9yIGFsbCBpbWFnZSBvYmplY3RzIHRvIGJlIHByZXNlbnQgaW4gdGhlIERPTVxuXHRcdCR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1vcmRlcmluZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRTdGFjay5sZW5ndGggPSAwO1xuICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZyA9IDA7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbigndHJhbnNlY3RzLmltYWdlcy5uZXctZmlsdGVyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZFN0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nID0gMDtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFRyYW5zZWN0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gR2xvYmFsIGNvbnRyb2xsZXIgZm9yIHRoZSB0cmFuc2VjdHMgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdUcmFuc2VjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHNldHRpbmdzLCBmbGFncykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHNldHRpbmdzO1xuXG4gICAgICAgICRzY29wZS5mbGFncyA9IGZsYWdzO1xuXG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7d2lkdGg6ICBpbWFnZXMucHJvZ3Jlc3MoKSAqIDEwMCArICclJ307XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2V0IHRoZSBvcmRlcmluZyBvZiB0aGUgZGlzcGxheWVkIGltYWdlc1xuICAgICAgICAkc2NvcGUuc2V0SW1hZ2VzU2VxdWVuY2UgPSBpbWFnZXMucmVvcmRlcjtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGF6eUltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhenkgbG9hZGluZyBpbWFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWFnZScsIGZ1bmN0aW9uICgkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBzY29wZS5lbnF1ZXVlSW1hZ2UoZGVmZXJyZWQucHJvbWlzZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnbG9hZCBlcnJvcicsIGRlZmVycmVkLnJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICBhdHRycy4kc2V0KCdzcmMnLCBhdHRycy5sYXp5SW1hZ2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBmbGFnc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgaW1hZ2UgZmxhZ3Mgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnZmxhZ3MnLCBmdW5jdGlvbiAoVFJBTlNFQ1RfSUQsIFRSQU5TRUNUX0lNQUdFUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmFjdGl2ZV9maWx0ZXJzJztcbiAgICAgICAgdmFyIGFjdGl2ZU5lZ2F0ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5hY3RpdmVfbmVnYXRlX2ZpbHRlcnMnO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmxpc3QgPSBmbGFncztcblxuICAgICAgICAvLyBjYWNoZXMgYSBtYXAgb2YgYWxsIGZsYWdzIGZvciBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdFxuICAgICAgICB0aGlzLmNhY2hlID0ge307XG5cbiAgICAgICAgdmFyIGFjdGl2ZUZpbHRlcnMgPSBbXTtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgYWN0aXZlIGZpbHRlcnNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGl2ZU5lZ2F0ZUZpbHRlcnMgPSBbXTtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgYWN0aXZlIG5lZ2F0ZSBmaWx0ZXJzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZU5lZ2F0ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBhY3RpdmVOZWdhdGVGaWx0ZXJzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZU5lZ2F0ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXRGbGFnc09mSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGZsYWdJZCBpbiBmbGFncykge1xuICAgICAgICAgICAgICAgIGlmIChmbGFnc1tmbGFnSWRdLmlkcy5pbmRleE9mKGlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZmxhZ3NbZmxhZ0lkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZW5ld0NhY2hlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5jYWNoZVtUUkFOU0VDVF9JTUFHRVNbaV1dID0gZ2V0RmxhZ3NPZkltYWdlKFRSQU5TRUNUX0lNQUdFU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlcklzQWN0aXZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVycy5pbmRleE9mKGlkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG5lZ2F0ZUZpbHRlcklzQWN0aXZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlTmVnYXRlRmlsdGVycy5pbmRleE9mKGlkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFjdGl2YXRlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlRmlsdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMucHVzaChpZCk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoYWN0aXZlRmlsdGVycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRlYWN0aXZhdGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFjdGl2ZUZpbHRlcnMuaW5kZXhPZihpZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm47XG4gICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlRmlsdGVyID0gZmFsc2U7XG4gICAgICAgICAgICBhY3RpdmVGaWx0ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoYWN0aXZlRmlsdGVycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFjdGl2YXRlTmVnYXRlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlTmVnYXRlRmlsdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGFjdGl2ZU5lZ2F0ZUZpbHRlcnMucHVzaChpZCk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZU5lZ2F0ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoYWN0aXZlTmVnYXRlRmlsdGVycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRlYWN0aXZhdGVOZWdhdGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFjdGl2ZU5lZ2F0ZUZpbHRlcnMuaW5kZXhPZihpZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm47XG4gICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlTmVnYXRlRmlsdGVyID0gZmFsc2U7XG4gICAgICAgICAgICBhY3RpdmVOZWdhdGVGaWx0ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZU5lZ2F0ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoYWN0aXZlTmVnYXRlRmlsdGVycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGlkOiBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZmxhZy4gV2lsbCBiZSBhZGRlZCBhcyBjbGFzcyBvZiB0aGUgZmxhZyBlbGVtZW50IGZvciBlYWNoIGVsZW1lbnRcbiAgICAgICAgICogaWRzOiBJRHMgb2YgdGhlIGltYWdlcyB0byBiZSBmbGFnZ2VkXG4gICAgICAgICAqIHRpdGxlOiBDb250ZW50IGZvciB0aGUgdGl0bGUgcHJvcGVydHkgb2YgdGhlIGltYWdlIGZsYWcgZWxlbWVudFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hZGQgPSBmdW5jdGlvbiAoaWQsIGlkcywgdGl0bGUpIHtcbiAgICAgICAgICAgIGZsYWdzW2lkXSA9IHtcbiAgICAgICAgICAgICAgICBjc3NDbGFzczogaWQsXG4gICAgICAgICAgICAgICAgaWRzOiBpZHMsXG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgICAgIGFjdGl2ZUZpbHRlcjogZmlsdGVySXNBY3RpdmUoaWQpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZU5lZ2F0ZUZpbHRlcjogbmVnYXRlRmlsdGVySXNBY3RpdmUoaWQpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVuZXdDYWNoZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBkZWxldGUgZmxhZ3NbaWRdO1xuICAgICAgICAgICAgcmVuZXdDYWNoZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBpZiAoIWZsYWdzLmhhc093blByb3BlcnR5KGlkKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoZmlsdGVySXNBY3RpdmUoaWQpKSB7XG4gICAgICAgICAgICAgICAgZGVhY3RpdmF0ZUZpbHRlcihpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFjdGl2YXRlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVhY3RpdmF0ZU5lZ2F0ZUZpbHRlcihpZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVOZWdhdGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGlmICghZmxhZ3MuaGFzT3duUHJvcGVydHkoaWQpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChuZWdhdGVGaWx0ZXJJc0FjdGl2ZShpZCkpIHtcbiAgICAgICAgICAgICAgICBkZWFjdGl2YXRlTmVnYXRlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWN0aXZhdGVOZWdhdGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVhY3RpdmF0ZUZpbHRlcihpZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBY3RpdmVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aXZlRmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZpbHRlcnMucHVzaChmbGFnc1thY3RpdmVGaWx0ZXJzW2ldXS5pZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVycztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc0FjdGl2ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVycy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWN0aXZlTmVnYXRlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGl2ZU5lZ2F0ZUZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goZmxhZ3NbYWN0aXZlTmVnYXRlRmlsdGVyc1tpXV0uaWRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNBY3RpdmVOZWdhdGVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZU5lZ2F0ZUZpbHRlcnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBsaXN0IG9mIGltYWdlcyB0byBkaXNwbGF5XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTLCBmaWx0ZXJTdWJzZXQsIGZpbHRlckV4Y2x1ZGUsIGZsYWdzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGluaXRpYWxseSBzaG93biBpbWFnZXNcbiAgICAgICAgdmFyIGluaXRpYWxMaW1pdCA9IDIwO1xuXG4gICAgICAgIHZhciBpbWFnZXNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnO1xuICAgICAgICB2YXIgb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5vcmRlcmluZyc7XG5cbiAgICAgICAgdmFyIG9yZGVyaW5nID0gW107XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgIHRoaXMuc2VxdWVuY2UgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgaW1hZ2Ugc2VxdWVuY2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgX3RoaXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgIC8vIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgc3RvcmVkIGltYWdlIG9yZGVyaW5nXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW29yZGVyaW5nTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgb3JkZXJpbmcgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICB0aGlzLmxlbmd0aCA9IHRoaXMuc2VxdWVuY2UubGVuZ3RoO1xuXG4gICAgICAgIHZhciB1cGRhdGVTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzaG91bGRTdG9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKG9yZGVyaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShvcmRlcmluZywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgICAgIC8vIHRha2Ugb25seSB0aG9zZSBJRHMgdGhhdCBhY3R1YWxseSBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiBJRHMgYXJlIHRha2VuIGZyb20gbG9jYWwgc3RvcmFnZSBidXQgdGhlIHRyYW5zZWN0IGhhcyBjaGFuZ2VkKVxuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgVFJBTlNFQ1RfSU1BR0VTLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBmbGFncy5nZXRBY3RpdmVGaWx0ZXJzKCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNob3VsZFN0b3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIGZpbHRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZpbHRlcnMgPSBmbGFncy5nZXRBY3RpdmVOZWdhdGVGaWx0ZXJzKCk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZpbHRlckV4Y2x1ZGUoX3RoaXMuc2VxdWVuY2UsIGZpbHRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIF90aGlzLmxlbmd0aCA9IF90aGlzLnNlcXVlbmNlLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHNob3VsZFN0b3JlKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzcGVjaWFsIG9yZGVyaW5nIG9yIGZpbHRlcmluZywgdGhlIHNlcXVlbmNlIHNob3VsZG4ndCBiZSBzdG9yZWRcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oaW1hZ2VzTG9jYWxTdG9yYWdlS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdXBkYXRlRmlsdGVyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICBfdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctZmlsdGVyaW5nJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5sZW5ndGggPiAwID8gTWF0aC5taW4oX3RoaXMubGltaXQgLyBfdGhpcy5sZW5ndGgsIDEpIDogMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlb3JkZXIgPSBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICBvcmRlcmluZyA9IEFycmF5LmlzQXJyYXkoaWRzKSA/IGlkcyA6IFtdO1xuICAgICAgICAgICAgaWYgKG9yZGVyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW29yZGVyaW5nTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KG9yZGVyaW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZG9udCBzYXZlIHRoZSBvcmRlcmluZyBpZiBpdCBlcXVhbHMgdGhlIFRSQU5TRUNUX0lNQUdFU1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShvcmRlcmluZ0xvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVwZGF0ZVNlcXVlbmNlKCk7XG4gICAgICAgICAgICAvLyByZXNldCBsaW1pdFxuICAgICAgICAgICAgX3RoaXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LW9yZGVyaW5nJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZsYWdzLnRvZ2dsZUZpbHRlcihpZCk7XG4gICAgICAgICAgICB1cGRhdGVGaWx0ZXJpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZU5lZ2F0ZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZmxhZ3MudG9nZ2xlTmVnYXRlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIHVwZGF0ZUZpbHRlcmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICBfdGhpcy5saW1pdCArPSBzdGVwO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzZXR0aW5nc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgc2V0dGluZ3Mgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnc2V0dGluZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZXR0aW5nc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy5zZXR0aW5ncyc7XG5cbiAgICAgICAgLy8gY2xpZW50LXNpZGUgKGRlZmF1bHQpIHNldHRpbmdzIGZvciBhbGwgdHJhbnNlY3QgaW5kZXggcGFnZXNcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgICAgJ3Nob3ctZmxhZ3MnOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZXh0ZW5kL292ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBsb2NhbCBvbmVzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc2V0dGluZ3MsIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
