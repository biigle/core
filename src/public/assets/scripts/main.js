/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9GaWx0ZXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvSW1hZ2VzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1RyYW5zZWN0Q29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvbGF6eUltYWdlLmpzIiwic2VydmljZXMvZmxhZ3MuanMiLCJzZXJ2aWNlcy9pbWFnZXMuanMiLCJzZXJ2aWNlcy9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxrQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7OztBQ0dBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLDREQUFBLFVBQUEsUUFBQSxRQUFBLGlCQUFBO0VBQ0E7O1FBRUEsT0FBQSxnQkFBQSxnQkFBQTs7UUFFQSxJQUFBLFNBQUEsWUFBQTtZQUNBLE9BQUEsa0JBQUEsT0FBQTs7O1FBR0EsT0FBQSxJQUFBLGtDQUFBO1FBQ0E7Ozs7Ozs7Ozs7OztBQ1RBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQSxPQUFBLFNBQUEsT0FBQSxRQUFBO0lBQ0EsT0FBQSxRQUFBO0lBQ0EsaUJBQUEsU0FBQSxZQUFBO1VBQ0E7O0lBRUEsU0FB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YWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRmlsdGVyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGZpbHRlciBmZWF0dXJlIG9mIHRoZSB0cmFuc2VjdHMgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdGaWx0ZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCBUUkFOU0VDVF9JTUFHRVMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUudG90YWxOb0ltYWdlcyA9IFRSQU5TRUNUX0lNQUdFUy5sZW5ndGg7XG5cbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50Tm9JbWFnZXMgPSBpbWFnZXMubGVuZ3RoO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LWZpbHRlcmluZycsIHVwZGF0ZSk7XG4gICAgICAgIHVwZGF0ZSgpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSwgaW1hZ2VzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzLmFkdmFuY2Uoc3RlcCk7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSAmJiBpbWFnZXMubGltaXQgPD0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0XHRpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuXG4gICAgICAgIC8vIHRpbWVvdXQgdG8gd2FpdCBmb3IgYWxsIGltYWdlIG9iamVjdHMgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LW9yZGVyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZFN0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nID0gMDtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuICAgICAgICAgICAgJHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgc2V0dGluZ3MsIGZsYWdzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICAgICAgJHNjb3BlLmZsYWdzID0gZmxhZ3M7XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHt3aWR0aDogIGltYWdlcy5wcm9ncmVzcygpICogMTAwICsgJyUnfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzZXQgdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXNwbGF5ZWQgaW1hZ2VzXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGltYWdlcy5yZW9yZGVyO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYXp5SW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgbGF6eSBsb2FkaW5nIGltYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmRpcmVjdGl2ZSgnbGF6eUltYWdlJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHNjb3BlLmVucXVldWVJbWFnZShkZWZlcnJlZC5wcm9taXNlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdsb2FkIGVycm9yJywgZGVmZXJyZWQucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLiRzZXQoJ3NyYycsIGF0dHJzLmxhenlJbWFnZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGZsYWdzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBpbWFnZSBmbGFncyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdmbGFncycsIGZ1bmN0aW9uIChUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuYWN0aXZlX2ZpbHRlcnMnO1xuICAgICAgICB2YXIgYWN0aXZlTmVnYXRlRmlsdGVyc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmFjdGl2ZV9uZWdhdGVfZmlsdGVycyc7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZsYWdzID0ge307XG4gICAgICAgIHRoaXMubGlzdCA9IGZsYWdzO1xuXG4gICAgICAgIC8vIGNhY2hlcyBhIG1hcCBvZiBhbGwgZmxhZ3MgZm9yIGFsbCBpbWFnZXMgb2YgdGhlIHRyYW5zZWN0XG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcblxuICAgICAgICB2YXIgYWN0aXZlRmlsdGVycyA9IFtdO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBhY3RpdmUgZmlsdGVyc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYWN0aXZlRmlsdGVycyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWN0aXZlTmVnYXRlRmlsdGVycyA9IFtdO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBhY3RpdmUgbmVnYXRlIGZpbHRlcnNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlTmVnYXRlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFjdGl2ZU5lZ2F0ZUZpbHRlcnMgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlTmVnYXRlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdldEZsYWdzT2ZJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZmxhZ0lkIGluIGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzW2ZsYWdJZF0uaWRzLmluZGV4T2YoaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChmbGFnc1tmbGFnSWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlbmV3Q2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRSQU5TRUNUX0lNQUdFUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF90aGlzLmNhY2hlW1RSQU5TRUNUX0lNQUdFU1tpXV0gPSBnZXRGbGFnc09mSW1hZ2UoVFJBTlNFQ1RfSU1BR0VTW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZmlsdGVySXNBY3RpdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmluZGV4T2YoaWQpICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbmVnYXRlRmlsdGVySXNBY3RpdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVOZWdhdGVGaWx0ZXJzLmluZGV4T2YoaWQpICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYWN0aXZhdGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgYWN0aXZlRmlsdGVycy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZGVhY3RpdmF0ZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gYWN0aXZlRmlsdGVycy5pbmRleE9mKGlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYWN0aXZhdGVOZWdhdGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVOZWdhdGVGaWx0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgYWN0aXZlTmVnYXRlRmlsdGVycy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlTmVnYXRlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVOZWdhdGVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZGVhY3RpdmF0ZU5lZ2F0ZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gYWN0aXZlTmVnYXRlRmlsdGVycy5pbmRleE9mKGlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVOZWdhdGVGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIGFjdGl2ZU5lZ2F0ZUZpbHRlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlTmVnYXRlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVOZWdhdGVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogaWQ6IFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBmbGFnLiBXaWxsIGJlIGFkZGVkIGFzIGNsYXNzIG9mIHRoZSBmbGFnIGVsZW1lbnQgZm9yIGVhY2ggZWxlbWVudFxuICAgICAgICAgKiBpZHM6IElEcyBvZiB0aGUgaW1hZ2VzIHRvIGJlIGZsYWdnZWRcbiAgICAgICAgICogdGl0bGU6IENvbnRlbnQgZm9yIHRoZSB0aXRsZSBwcm9wZXJ0eSBvZiB0aGUgaW1hZ2UgZmxhZyBlbGVtZW50XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChpZCwgaWRzLCB0aXRsZSkge1xuICAgICAgICAgICAgZmxhZ3NbaWRdID0ge1xuICAgICAgICAgICAgICAgIGNzc0NsYXNzOiBpZCxcbiAgICAgICAgICAgICAgICBpZHM6IGlkcyxcbiAgICAgICAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVyOiBmaWx0ZXJJc0FjdGl2ZShpZCksXG4gICAgICAgICAgICAgICAgYWN0aXZlTmVnYXRlRmlsdGVyOiBuZWdhdGVGaWx0ZXJJc0FjdGl2ZShpZClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBmbGFnc1tpZF07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGlmICghZmxhZ3MuaGFzT3duUHJvcGVydHkoaWQpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXJJc0FjdGl2ZShpZCkpIHtcbiAgICAgICAgICAgICAgICBkZWFjdGl2YXRlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWN0aXZhdGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWFjdGl2YXRlTmVnYXRlRmlsdGVyKGlkKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZU5lZ2F0ZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgaWYgKCFmbGFncy5oYXNPd25Qcm9wZXJ0eShpZCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG5lZ2F0ZUZpbHRlcklzQWN0aXZlKGlkKSkge1xuICAgICAgICAgICAgICAgIGRlYWN0aXZhdGVOZWdhdGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhY3RpdmF0ZU5lZ2F0ZUZpbHRlcihpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWFjdGl2YXRlRmlsdGVyKGlkKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFjdGl2ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3RpdmVGaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGZsYWdzW2FjdGl2ZUZpbHRlcnNbaV1dLmlkcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzQWN0aXZlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBY3RpdmVOZWdhdGVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aXZlTmVnYXRlRmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZpbHRlcnMucHVzaChmbGFnc1thY3RpdmVOZWdhdGVGaWx0ZXJzW2ldXS5pZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVycztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc0FjdGl2ZU5lZ2F0ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlTmVnYXRlRmlsdGVycy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIGxpc3Qgb2YgaW1hZ2VzIHRvIGRpc3BsYXlcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMsIGZpbHRlclN1YnNldCwgZmlsdGVyRXhjbHVkZSwgZmxhZ3MpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBudW1iZXIgb2YgaW5pdGlhbGx5IHNob3duIGltYWdlc1xuICAgICAgICB2YXIgaW5pdGlhbExpbWl0ID0gMjA7XG5cbiAgICAgICAgdmFyIGltYWdlc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmltYWdlcyc7XG4gICAgICAgIHZhciBvcmRlcmluZ0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLm9yZGVyaW5nJztcblxuICAgICAgICB2YXIgb3JkZXJpbmcgPSBbXTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IGRpc3BsYXllZCBvcmRlcmluZyBvZiBpbWFnZXMgKGFzIGFycmF5IG9mIGltYWdlIElEcylcbiAgICAgICAgdGhpcy5zZXF1ZW5jZSA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICB0aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBpbWFnZSBzZXF1ZW5jZVxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBfdGhpcy5zZXF1ZW5jZSA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBpbWFnZXMgbG9hZGVkIGZyb20gc3RvcmFnZSBhcmUgc3RpbGwgdGhlcmUgaW4gdGhlIHRyYW5zZWN0LlxuICAgICAgICAgICAgLy8gc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZCBpbiB0aGUgbWVhbnRpbWUuXG4gICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIFRSQU5TRUNUX0lNQUdFUywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbmd1bGFyLmNvcHkoVFJBTlNFQ1RfSU1BR0VTLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgaW1hZ2Ugb3JkZXJpbmdcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBvcmRlcmluZyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtvcmRlcmluZ0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIG92ZXJhbGwgaW1hZ2VzXG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5zZXF1ZW5jZS5sZW5ndGg7XG5cbiAgICAgICAgdmFyIHVwZGF0ZVNlcXVlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNob3VsZFN0b3JlID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAob3JkZXJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG91bGRTdG9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KG9yZGVyaW5nLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgLy8gdGFrZSBvbmx5IHRob3NlIElEcyB0aGF0IGFjdHVhbGx5IGJlbG9uZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAvLyAoZS5nLiB3aGVuIElEcyBhcmUgdGFrZW4gZnJvbSBsb2NhbCBzdG9yYWdlIGJ1dCB0aGUgdHJhbnNlY3QgaGFzIGNoYW5nZWQpXG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IGZsYWdzLmdldEFjdGl2ZUZpbHRlcnMoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgZmlsdGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZmlsdGVycyA9IGZsYWdzLmdldEFjdGl2ZU5lZ2F0ZUZpbHRlcnMoKTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzaG91bGRTdG9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgZmlsdGVyRXhjbHVkZShfdGhpcy5zZXF1ZW5jZSwgZmlsdGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgX3RoaXMubGVuZ3RoID0gX3RoaXMuc2VxdWVuY2UubGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAoc2hvdWxkU3RvcmUpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNwZWNpYWwgb3JkZXJpbmcgb3IgZmlsdGVyaW5nLCB0aGUgc2VxdWVuY2Ugc2hvdWxkbid0IGJlIHN0b3JlZFxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShpbWFnZXNMb2NhbFN0b3JhZ2VLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cGRhdGVGaWx0ZXJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmxlbmd0aCA+IDAgPyBNYXRoLm1pbihfdGhpcy5saW1pdCAvIF90aGlzLmxlbmd0aCwgMSkgOiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVvcmRlciA9IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgICAgIG9yZGVyaW5nID0gQXJyYXkuaXNBcnJheShpZHMpID8gaWRzIDogW107XG4gICAgICAgICAgICBpZiAob3JkZXJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkob3JkZXJpbmcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBkb250IHNhdmUgdGhlIG9yZGVyaW5nIGlmIGl0IGVxdWFscyB0aGUgVFJBTlNFQ1RfSU1BR0VTXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKG9yZGVyaW5nTG9jYWxTdG9yYWdlS2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICBfdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctb3JkZXJpbmcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZmxhZ3MudG9nZ2xlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIHVwZGF0ZUZpbHRlcmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlTmVnYXRlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmbGFncy50b2dnbGVOZWdhdGVGaWx0ZXIoaWQpO1xuICAgICAgICAgICAgdXBkYXRlRmlsdGVyaW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ICs9IHN0ZXA7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHNldHRpbmdzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBzZXR0aW5ncyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdzZXR0aW5ncycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLnNldHRpbmdzJztcblxuICAgICAgICAvLyBjbGllbnQtc2lkZSAoZGVmYXVsdCkgc2V0dGluZ3MgZm9yIGFsbCB0cmFuc2VjdCBpbmRleCBwYWdlc1xuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAnc2hvdy1mbGFncyc6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBleHRlbmQvb3ZlcnJpZGUgZGVmYXVsdCBzZXR0aW5ncyB3aXRoIGxvY2FsIG9uZXNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShzZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9