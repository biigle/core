/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api', 'dias.ui']);

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

            _this.length = _this.sequence.length;

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2xhenlJbWFnZS5qcyIsImNvbnRyb2xsZXJzL0ltYWdlc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9UcmFuc2VjdENvbnRyb2xsZXIuanMiLCJzZXJ2aWNlcy9mbGFncy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7OztBQ1ZBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQSxPQUFBLFNBQUEsT0FBQSxRQUFBO0lBQ0EsT0FBQSxRQUFBO0lBQ0EsaUJBQUEsU0FBQSxZQUFBO1VBQ0E7O0lBRUEsU0FBQSxPQUFBO0lBQ0EsUUFBQSxpQkFBQSxVQUFBO0lBQ0EsT0FBQSxpQkFBQSxVQUFBOzs7OztRQUtBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsbUJBQUEsdUJBQUEsVUFBQSxTQUFBLEdBQUE7Z0JBQ0E7Z0JBQ0EsVUFBQSxNQUFBOzs7Ozs7UUFNQSxPQUFBLGVBQUEsVUFBQSxhQUFBO1lBQ0EsSUFBQSxXQUFBLEdBQUE7O1lBRUEsVUFBQSxLQUFBOztZQUVBLFlBQUEsS0FBQSxZQUFBOzs7Z0JBR0E7Z0JBQ0E7O1lBRUEsSUFBQSxxQkFBQSxHQUFBO1lBQ0EsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLFNBQUE7OztFQUdBLFNBQUE7UUFDQSxPQUFBLElBQUEsaUNBQUEsWUFBQTtZQUNBLFVBQUEsU0FBQTtZQUNBLG1CQUFBO1lBQ0EsU0FBQTs7O1FBR0EsT0FBQSxJQUFBLGtDQUFBLFlBQUE7WUFDQSxVQUFBLFNBQUE7WUFDQSxtQkFBQTtZQUNBLFNBQUE7Ozs7Ozs7Ozs7OztBQ2xGQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSxnRUFBQSxVQUFBLFFBQUEsUUFBQSxVQUFBLE9BQUE7RUFDQTs7UUFFQSxPQUFBLFdBQUE7O1FBRUEsT0FBQSxRQUFBOztRQUVBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLFFBQUEsT0FBQSxhQUFBLE1BQUE7Ozs7UUFJQSxPQUFBLG9CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDWkEsUUFBQSxPQUFBLGtCQUFBLFFBQUEsNENBQUEsVUFBQSxhQUFBLGlCQUFBO1FBQ0E7O1FBRUEsSUFBQSwrQkFBQSxvQkFBQSxjQUFBOztRQUVBLElBQUEsUUFBQTtRQUNBLElBQUEsUUFBQTtRQUNBLEtBQUEsT0FBQTs7O1FBR0EsS0FBQSxRQUFBOztRQUVBLElBQUEsZ0JBQUE7OztRQUdBLElBQUEsT0FBQSxhQUFBLCtCQUFBO1lBQ0EsZ0JBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1FBR0EsSUFBQSxrQkFBQSxVQUFBLElBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxLQUFBLElBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsTUFBQSxRQUFBLElBQUEsUUFBQSxRQUFBLENBQUEsR0FBQTtvQkFDQSxPQUFBLEtBQUEsTUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsYUFBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLGdCQUFBLFFBQUEsS0FBQTtnQkFDQSxNQUFBLE1BQUEsZ0JBQUEsTUFBQSxnQkFBQSxnQkFBQTs7OztRQUlBLElBQUEsaUJBQUEsVUFBQSxJQUFBO1lBQ0EsT0FBQSxjQUFBLFFBQUEsUUFBQSxDQUFBOzs7Ozs7OztRQVFBLEtBQUEsTUFBQSxVQUFBLElBQUEsS0FBQSxPQUFBO1lBQ0EsTUFBQSxNQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxPQUFBO2dCQUNBLGNBQUEsZUFBQTs7WUFFQTs7O1FBR0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtZQUNBOzs7UUFHQSxLQUFBLGVBQUEsVUFBQSxJQUFBO1lBQ0EsSUFBQSxlQUFBLEtBQUE7Z0JBQ0EsTUFBQSxJQUFBLGVBQUE7Z0JBQ0EsY0FBQSxPQUFBLGNBQUEsUUFBQSxLQUFBO21CQUNBO2dCQUNBLE1BQUEsSUFBQSxlQUFBO2dCQUNBLGNBQUEsS0FBQTs7O1lBR0EsT0FBQSxhQUFBLGdDQUFBLEtBQUEsVUFBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLGNBQUEsUUFBQSxLQUFBO2dCQUNBLFFBQUEsS0FBQSxNQUFBLGNBQUEsSUFBQTs7O1lBR0EsT0FBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsT0FBQSxjQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ2xGQSxRQUFBLE9BQUEsa0JBQUEsUUFBQSxvRkFBQSxVQUFBLFlBQUEsYUFBQSxpQkFBQSxjQUFBLE9BQUE7UUFDQTs7UUFFQSxJQUFBLFFBQUE7OztRQUdBLElBQUEsZUFBQTs7UUFFQSxJQUFBLHdCQUFBLG9CQUFBLGNBQUE7UUFDQSxJQUFBLDBCQUFBLG9CQUFBLGNBQUE7O1FBRUEsSUFBQSxXQUFBOzs7UUFHQSxLQUFBLFdBQUE7O1FBRUEsS0FBQSxRQUFBOzs7UUFHQSxJQUFBLE9BQUEsYUFBQSx3QkFBQTtZQUNBLE1BQUEsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7WUFHQSxhQUFBLE1BQUEsVUFBQSxpQkFBQTtlQUNBO1lBQ0EsUUFBQSxLQUFBLGlCQUFBLE1BQUE7Ozs7UUFJQSxJQUFBLE9BQUEsYUFBQSwwQkFBQTtZQUNBLFdBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7OztRQUlBLEtBQUEsU0FBQSxLQUFBLFNBQUE7O1FBRUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0EsSUFBQSxjQUFBO1lBQ0EsSUFBQSxTQUFBLFdBQUEsR0FBQTtnQkFDQSxRQUFBLEtBQUEsaUJBQUEsTUFBQTttQkFDQTtnQkFDQSxjQUFBO2dCQUNBLFFBQUEsS0FBQSxVQUFBLE1BQUE7OztnQkFHQSxhQUFBLE1BQUEsVUFBQSxpQkFBQTs7O1lBR0EsSUFBQSxVQUFBLE1BQUE7O1lBRUEsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsUUFBQSxLQUFBO2dCQUNBLGNBQUE7Z0JBQ0EsYUFBQSxNQUFBLFVBQUEsUUFBQTs7O1lBR0EsTUFBQSxTQUFBLE1BQUEsU0FBQTs7WUFFQSxJQUFBLGFBQUE7Z0JBQ0EsT0FBQSxhQUFBLHlCQUFBLEtBQUEsVUFBQSxNQUFBO21CQUNBOztnQkFFQSxPQUFBLGFBQUEsV0FBQTs7OztRQUlBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQSxNQUFBLFNBQUEsSUFBQSxLQUFBLElBQUEsTUFBQSxRQUFBLE1BQUEsUUFBQSxLQUFBOzs7UUFHQSxLQUFBLFVBQUEsVUFBQSxLQUFBO1lBQ0EsV0FBQSxNQUFBLFFBQUEsT0FBQSxNQUFBO1lBQ0EsSUFBQSxTQUFBLFNBQUEsR0FBQTtnQkFDQSxPQUFBLGFBQUEsMkJBQUEsS0FBQSxVQUFBO21CQUNBOztnQkFFQSxPQUFBLGFBQUEsV0FBQTs7O1lBR0E7O1lBRUEsTUFBQSxRQUFBO1lBQ0EsV0FBQSxXQUFBOzs7UUFHQSxLQUFBLGVBQUEsVUFBQSxJQUFBO1lBQ0EsTUFBQSxhQUFBO1lBQ0E7O1lBRUEsTUFBQSxRQUFBO1lBQ0EsV0FBQSxXQUFBOzs7UUFHQSxLQUFBLFVBQUEsVUFBQSxNQUFBO1lBQ0EsTUFBQSxTQUFBOzs7Ozs7Ozs7Ozs7QUM3RkEsUUFBQSxPQUFBLGtCQUFBLFFBQUEsWUFBQSxZQUFBO1FBQ0E7O1FBRUEsSUFBQSwwQkFBQTs7O1FBR0EsSUFBQSxXQUFBO1lBQ0EsY0FBQTs7OztRQUlBLElBQUEsT0FBQSxhQUFBLDBCQUFBO1lBQ0EsUUFBQSxPQUFBLFVBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsU0FBQSxPQUFBO1lBQ0EsT0FBQSxhQUFBLDJCQUFBLEtBQUEsVUFBQTs7O1FBR0EsS0FBQSxNQUFBLFVBQUEsS0FBQTtZQUNBLE9BQUEsU0FBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSwgaW1hZ2VzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzLmFkdmFuY2Uoc3RlcCk7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSAmJiBpbWFnZXMubGltaXQgPD0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0XHRpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuXG4gICAgICAgIC8vIHRpbWVvdXQgdG8gd2FpdCBmb3IgYWxsIGltYWdlIG9iamVjdHMgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LW9yZGVyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZFN0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nID0gMDtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuICAgICAgICAgICAgJHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgc2V0dGluZ3MsIGZsYWdzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICAgICAgJHNjb3BlLmZsYWdzID0gZmxhZ3M7XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHt3aWR0aDogIGltYWdlcy5wcm9ncmVzcygpICogMTAwICsgJyUnfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzZXQgdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXNwbGF5ZWQgaW1hZ2VzXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGltYWdlcy5yZW9yZGVyO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgZmxhZ3NcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIGltYWdlIGZsYWdzIG9mIHRoZSB0cmFuc2VjdCBpbmRleCBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ2ZsYWdzJywgZnVuY3Rpb24gKFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGFjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5hY3RpdmVfZmlsdGVycyc7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZsYWdzID0ge307XG4gICAgICAgIHRoaXMubGlzdCA9IGZsYWdzO1xuXG4gICAgICAgIC8vIGNhY2hlcyBhIG1hcCBvZiBhbGwgZmxhZ3MgZm9yIGFsbCBpbWFnZXMgb2YgdGhlIHRyYW5zZWN0XG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcblxuICAgICAgICB2YXIgYWN0aXZlRmlsdGVycyA9IFtdO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBhY3RpdmUgZmlsdGVyc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYWN0aXZlRmlsdGVycyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ2V0RmxhZ3NPZkltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBmbGFnSWQgaW4gZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3NbZmxhZ0lkXS5pZHMuaW5kZXhPZihpZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGZsYWdzW2ZsYWdJZF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVuZXdDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVFJBTlNFQ1RfSU1BR0VTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2FjaGVbVFJBTlNFQ1RfSU1BR0VTW2ldXSA9IGdldEZsYWdzT2ZJbWFnZShUUkFOU0VDVF9JTUFHRVNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaWx0ZXJJc0FjdGl2ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlcnMuaW5kZXhPZihpZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBpZDogVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGZsYWcuIFdpbGwgYmUgYWRkZWQgYXMgY2xhc3Mgb2YgdGhlIGZsYWcgZWxlbWVudCBmb3IgZWFjaCBlbGVtZW50XG4gICAgICAgICAqIGlkczogSURzIG9mIHRoZSBpbWFnZXMgdG8gYmUgZmxhZ2dlZFxuICAgICAgICAgKiB0aXRsZTogQ29udGVudCBmb3IgdGhlIHRpdGxlIHByb3BlcnR5IG9mIHRoZSBpbWFnZSBmbGFnIGVsZW1lbnRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYWRkID0gZnVuY3Rpb24gKGlkLCBpZHMsIHRpdGxlKSB7XG4gICAgICAgICAgICBmbGFnc1tpZF0gPSB7XG4gICAgICAgICAgICAgICAgY3NzQ2xhc3M6IGlkLFxuICAgICAgICAgICAgICAgIGlkczogaWRzLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgICAgICBhY3RpdmVGaWx0ZXI6IGZpbHRlcklzQWN0aXZlKGlkKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlbmV3Q2FjaGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZGVsZXRlIGZsYWdzW2lkXTtcbiAgICAgICAgICAgIHJlbmV3Q2FjaGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcklzQWN0aXZlKGlkKSkge1xuICAgICAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBhY3RpdmVGaWx0ZXJzLnNwbGljZShhY3RpdmVGaWx0ZXJzLmluZGV4T2YoaWQpLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxhZ3NbaWRdLmFjdGl2ZUZpbHRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVycy5wdXNoKGlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVthY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KGFjdGl2ZUZpbHRlcnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWN0aXZlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGl2ZUZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goZmxhZ3NbYWN0aXZlRmlsdGVyc1tpXV0uaWRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNBY3RpdmVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlcnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBsaXN0IG9mIGltYWdlcyB0byBkaXNwbGF5XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTLCBmaWx0ZXJTdWJzZXQsIGZsYWdzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGluaXRpYWxseSBzaG93biBpbWFnZXNcbiAgICAgICAgdmFyIGluaXRpYWxMaW1pdCA9IDIwO1xuXG4gICAgICAgIHZhciBpbWFnZXNMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnO1xuICAgICAgICB2YXIgb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5vcmRlcmluZyc7XG5cbiAgICAgICAgdmFyIG9yZGVyaW5nID0gW107XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgIHRoaXMuc2VxdWVuY2UgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgaW1hZ2Ugc2VxdWVuY2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgX3RoaXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgIC8vIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgc3RvcmVkIGltYWdlIG9yZGVyaW5nXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW29yZGVyaW5nTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgb3JkZXJpbmcgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbb3JkZXJpbmdMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICB0aGlzLmxlbmd0aCA9IHRoaXMuc2VxdWVuY2UubGVuZ3RoO1xuXG4gICAgICAgIHZhciB1cGRhdGVTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzaG91bGRTdG9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKG9yZGVyaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShvcmRlcmluZywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICAgICAgICAgIC8vIHRha2Ugb25seSB0aG9zZSBJRHMgdGhhdCBhY3R1YWxseSBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiBJRHMgYXJlIHRha2VuIGZyb20gbG9jYWwgc3RvcmFnZSBidXQgdGhlIHRyYW5zZWN0IGhhcyBjaGFuZ2VkKVxuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgVFJBTlNFQ1RfSU1BR0VTLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBmbGFncy5nZXRBY3RpdmVGaWx0ZXJzKCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNob3VsZFN0b3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIGZpbHRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5sZW5ndGggPSBfdGhpcy5zZXF1ZW5jZS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmIChzaG91bGRTdG9yZSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc3BlY2lhbCBvcmRlcmluZyBvciBmaWx0ZXJpbmcsIHRoZSBzZXF1ZW5jZSBzaG91bGRuJ3QgYmUgc3RvcmVkXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGltYWdlc0xvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5sZW5ndGggPiAwID8gTWF0aC5taW4oX3RoaXMubGltaXQgLyBfdGhpcy5sZW5ndGgsIDEpIDogMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlb3JkZXIgPSBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICBvcmRlcmluZyA9IEFycmF5LmlzQXJyYXkoaWRzKSA/IGlkcyA6IFtdO1xuICAgICAgICAgICAgaWYgKG9yZGVyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW29yZGVyaW5nTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KG9yZGVyaW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZG9udCBzYXZlIHRoZSBvcmRlcmluZyBpZiBpdCBlcXVhbHMgdGhlIFRSQU5TRUNUX0lNQUdFU1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShvcmRlcmluZ0xvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVwZGF0ZVNlcXVlbmNlKCk7XG4gICAgICAgICAgICAvLyByZXNldCBsaW1pdFxuICAgICAgICAgICAgX3RoaXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LW9yZGVyaW5nJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZsYWdzLnRvZ2dsZUZpbHRlcihpZCk7XG4gICAgICAgICAgICB1cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICAgICAgLy8gcmVzZXQgbGltaXRcbiAgICAgICAgICAgIF90aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICAgICAgX3RoaXMubGltaXQgKz0gc3RlcDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc2V0dGluZ3NcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIHNldHRpbmdzIG9mIHRoZSB0cmFuc2VjdCBpbmRleCBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLnNlcnZpY2UoJ3NldHRpbmdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuc2V0dGluZ3MnO1xuXG4gICAgICAgIC8vIGNsaWVudC1zaWRlIChkZWZhdWx0KSBzZXR0aW5ncyBmb3IgYWxsIHRyYW5zZWN0IGluZGV4IHBhZ2VzXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICdzaG93LWZsYWdzJzogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGV4dGVuZC9vdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzIHdpdGggbG9jYWwgb25lc1xuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHNldHRpbmdzLCBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBzZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=