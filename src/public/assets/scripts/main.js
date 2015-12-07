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

        // check for a stored image sorting sequence
        if (window.localStorage[imagesLocalStorageKey]) {
            _this.sequence = JSON.parse(window.localStorage[imagesLocalStorageKey]);
            // check if all images loaded from storage are still there in the transect.
            // some of them may have been deleted in the meantime.
            filterSubset(_this.sequence, TRANSECT_IMAGES, true);
        } else {
            angular.copy(TRANSECT_IMAGES, _this.sequence);
        }

        // number of overall images
        this.length = this.sequence.length;

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

            _this.length = _this.sequence.length;

            window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
        };

        this.progress = function () {
            return _this.length > 0 ? Math.min(_this.limit / _this.length, 1) : 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiLCJzZXJ2aWNlcy9mbGFncy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUEsWUFBQTs7Ozs7Ozs7OztBQ0lBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQSxPQUFBLFNBQUEsT0FBQSxRQUFBO0lBQ0EsT0FBQSxRQUFBO0lBQ0EsaUJBQUEsU0FBQSxZQUFBO1VBQ0E7O0lBRUEsU0FBQSxPQUFBO0lBQ0EsUUFBQSxpQkFBQSxVQUFBO0lBQ0EsT0FBQSxpQkFBQSxVQUFBOzs7OztRQUtBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsbUJBQUEsdUJBQUEsVUFBQSxTQUFBLEdBQUE7Z0JBQ0E7Z0JBQ0EsVUFBQSxNQUFBOzs7Ozs7UUFNQSxPQUFBLGVBQUEsVUFBQSxhQUFBO1lBQ0EsSUFBQSxXQUFBLEdBQUE7O1lBRUEsVUFBQSxLQUFBOztZQUVBLFlBQUEsS0FBQSxZQUFBOzs7Z0JBR0E7Z0JBQ0E7O1lBRUEsSUFBQSxxQkFBQSxHQUFBO1lBQ0EsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLFNBQUE7OztFQUdBLFNBQUE7UUFDQSxPQUFBLElBQUEsaUNBQUEsWUFBQTtZQUNBLFVBQUEsU0FBQTtZQUNBLG1CQUFBO1lBQ0EsU0FBQTs7O1FBR0EsT0FBQSxJQUFBLGtDQUFBLFlBQUE7WUFDQSxVQUFBLFNBQUE7WUFDQSxtQkFBQTtZQUNBLFNBQUE7Ozs7Ozs7Ozs7OztBQ2xGQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSxnRUFBQSxVQUFBLFFBQUEsUUFBQSxVQUFBLE9BQUE7RUFDQTs7UUFFQSxPQUFBLFdBQUE7O1FBRUEsT0FBQSxRQUFBOztRQUVBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLFFBQUEsT0FBQSxhQUFBLE1BQUE7Ozs7UUFJQSxPQUFBLG9CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDWkEsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7O0FDWEEsUUFBQSxPQUFBLGtCQUFBLFFBQUEsNENBQUEsVUFBQSxhQUFBLGlCQUFBO1FBQ0E7O1FBRUEsSUFBQSwrQkFBQSxvQkFBQSxjQUFBOztRQUVBLElBQUEsUUFBQTtRQUNBLElBQUEsUUFBQTtRQUNBLEtBQUEsT0FBQTs7O1FBR0EsS0FBQSxRQUFBOztRQUVBLElBQUEsZ0JBQUE7OztRQUdBLElBQUEsT0FBQSxhQUFBLCtCQUFBO1lBQ0EsZ0JBQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTs7O1FBR0EsSUFBQSxrQkFBQSxVQUFBLElBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxLQUFBLElBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsTUFBQSxRQUFBLElBQUEsUUFBQSxRQUFBLENBQUEsR0FBQTtvQkFDQSxPQUFBLEtBQUEsTUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsYUFBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLGdCQUFBLFFBQUEsS0FBQTtnQkFDQSxNQUFBLE1BQUEsZ0JBQUEsTUFBQSxnQkFBQSxnQkFBQTs7OztRQUlBLElBQUEsaUJBQUEsVUFBQSxJQUFBO1lBQ0EsT0FBQSxjQUFBLFFBQUEsUUFBQSxDQUFBOzs7Ozs7OztRQVFBLEtBQUEsTUFBQSxVQUFBLElBQUEsS0FBQSxPQUFBO1lBQ0EsTUFBQSxNQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxPQUFBO2dCQUNBLGNBQUEsZUFBQTs7WUFFQTs7O1FBR0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtZQUNBOzs7UUFHQSxLQUFBLGVBQUEsVUFBQSxJQUFBO1lBQ0EsSUFBQSxlQUFBLEtBQUE7Z0JBQ0EsTUFBQSxJQUFBLGVBQUE7Z0JBQ0EsY0FBQSxPQUFBLGNBQUEsUUFBQSxLQUFBO21CQUNBO2dCQUNBLE1BQUEsSUFBQSxlQUFBO2dCQUNBLGNBQUEsS0FBQTs7O1lBR0EsT0FBQSxhQUFBLGdDQUFBLEtBQUEsVUFBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLGNBQUEsUUFBQSxLQUFBO2dCQUNBLFFBQUEsS0FBQSxNQUFBLGNBQUEsSUFBQTs7O1lBR0EsT0FBQTs7O1FBR0EsS0FBQSxtQkFBQSxZQUFBO1lBQ0EsT0FBQSxjQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ2xGQSxRQUFBLE9BQUEsa0JBQUEsUUFBQSxvRkFBQSxVQUFBLFlBQUEsYUFBQSxpQkFBQSxjQUFBLE9BQUE7UUFDQTs7UUFFQSxJQUFBLFFBQUE7OztRQUdBLElBQUEsZUFBQTs7UUFFQSxJQUFBLHdCQUFBLG9CQUFBLGNBQUE7O1FBRUEsSUFBQSxXQUFBOzs7UUFHQSxLQUFBLFdBQUE7O1FBRUEsS0FBQSxRQUFBOzs7UUFHQSxJQUFBLE9BQUEsYUFBQSx3QkFBQTtZQUNBLE1BQUEsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7WUFHQSxhQUFBLE1BQUEsVUFBQSxpQkFBQTtlQUNBO1lBQ0EsUUFBQSxLQUFBLGlCQUFBLE1BQUE7Ozs7UUFJQSxLQUFBLFNBQUEsS0FBQSxTQUFBOztRQUVBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsU0FBQSxXQUFBLEdBQUE7O2dCQUVBLFFBQUEsS0FBQSxpQkFBQSxNQUFBO21CQUNBO2dCQUNBLFFBQUEsS0FBQSxVQUFBLE1BQUE7OztnQkFHQSxhQUFBLE1BQUEsVUFBQSxpQkFBQTs7O1lBR0EsSUFBQSxVQUFBLE1BQUE7O1lBRUEsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsUUFBQSxLQUFBO2dCQUNBLGFBQUEsTUFBQSxVQUFBLFFBQUE7OztZQUdBLE1BQUEsU0FBQSxNQUFBLFNBQUE7O1lBRUEsT0FBQSxhQUFBLHlCQUFBLEtBQUEsVUFBQSxNQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUEsTUFBQSxTQUFBLElBQUEsS0FBQSxJQUFBLE1BQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTs7O1FBR0EsS0FBQSxVQUFBLFVBQUEsS0FBQTtZQUNBLFdBQUEsTUFBQSxRQUFBLE9BQUEsTUFBQTtZQUNBOztZQUVBLE1BQUEsUUFBQTtZQUNBLFdBQUEsV0FBQTs7O1FBR0EsS0FBQSxlQUFBLFVBQUEsSUFBQTtZQUNBLE1BQUEsYUFBQTtZQUNBOztZQUVBLE1BQUEsUUFBQTtZQUNBLFdBQUEsV0FBQTs7O1FBR0EsS0FBQSxVQUFBLFVBQUEsTUFBQTtZQUNBLE1BQUEsU0FBQTs7Ozs7Ozs7Ozs7O0FDekVBLFFBQUEsT0FBQSxrQkFBQSxRQUFBLFlBQUEsWUFBQTtRQUNBOztRQUVBLElBQUEsMEJBQUE7OztRQUdBLElBQUEsV0FBQTtZQUNBLGNBQUE7Ozs7UUFJQSxJQUFBLE9BQUEsYUFBQSwwQkFBQTtZQUNBLFFBQUEsT0FBQSxVQUFBLEtBQUEsTUFBQSxPQUFBLGFBQUE7OztRQUdBLEtBQUEsTUFBQSxVQUFBLEtBQUEsT0FBQTtZQUNBLFNBQUEsT0FBQTtZQUNBLE9BQUEsYUFBQSwyQkFBQSxLQUFBLFVBQUE7OztRQUdBLEtBQUEsTUFBQSxVQUFBLEtBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7QUFJQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSwgaW1hZ2VzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzLmFkdmFuY2Uoc3RlcCk7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSAmJiBpbWFnZXMubGltaXQgPD0gaW1hZ2VzLmxlbmd0aCkge1xuXHRcdFx0XHRpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBzaG91bGQgbG9hZFxuICAgICAgICAvLyBnZXRzIGEgcHJvbWlzZSBhcyBhcmdpbWVudCB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgJHNjb3BlLmVucXVldWVJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgXCJzaG91bGQgbG9hZFwiIHByb21pc2UgdG8gdGhlIHN0YWNrXG4gICAgICAgICAgICBsb2FkU3RhY2sucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZW5xdWV1ZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgIGltYWdlTG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkZWQnLCBsb2FkU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBsb2FkIHRoZSBuZXh0IGltYWdlIGluIHRoZSBzdGFja1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmctLTtcbiAgICAgICAgICAgICAgICBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50bHlMb2FkaW5nID09PSAwKSBtYXliZUxvYWROZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuXG4gICAgICAgIC8vIHRpbWVvdXQgdG8gd2FpdCBmb3IgYWxsIGltYWdlIG9iamVjdHMgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMubmV3LW9yZGVyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZFN0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBjdXJyZW50bHlMb2FkaW5nID0gMDtcbiAgICAgICAgICAgICR0aW1lb3V0KGluaXRpYWxpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCd0cmFuc2VjdHMuaW1hZ2VzLm5ldy1maWx0ZXJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuICAgICAgICAgICAgJHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgc2V0dGluZ3MsIGZsYWdzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICAgICAgJHNjb3BlLmZsYWdzID0gZmxhZ3M7XG5cbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHt3aWR0aDogIGltYWdlcy5wcm9ncmVzcygpICogMTAwICsgJyUnfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzZXQgdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXNwbGF5ZWQgaW1hZ2VzXG4gICAgICAgICRzY29wZS5zZXRJbWFnZXNTZXF1ZW5jZSA9IGltYWdlcy5yZW9yZGVyO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYXp5SW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgbGF6eSBsb2FkaW5nIGltYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmRpcmVjdGl2ZSgnbGF6eUltYWdlJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHdhcyBsb2FkZWRcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHNjb3BlLmVucXVldWVJbWFnZShkZWZlcnJlZC5wcm9taXNlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5iaW5kKCdsb2FkIGVycm9yJywgZGVmZXJyZWQucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLiRzZXQoJ3NyYycsIGF0dHJzLmxhenlJbWFnZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGZsYWdzXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBpbWFnZSBmbGFncyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdmbGFncycsIGZ1bmN0aW9uIChUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhY3RpdmVGaWx0ZXJzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuYWN0aXZlX2ZpbHRlcnMnO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmxpc3QgPSBmbGFncztcblxuICAgICAgICAvLyBjYWNoZXMgYSBtYXAgb2YgYWxsIGZsYWdzIGZvciBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdFxuICAgICAgICB0aGlzLmNhY2hlID0ge307XG5cbiAgICAgICAgdmFyIGFjdGl2ZUZpbHRlcnMgPSBbXTtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgYWN0aXZlIGZpbHRlcnNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdldEZsYWdzT2ZJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZmxhZ0lkIGluIGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzW2ZsYWdJZF0uaWRzLmluZGV4T2YoaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChmbGFnc1tmbGFnSWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlbmV3Q2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRSQU5TRUNUX0lNQUdFUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF90aGlzLmNhY2hlW1RSQU5TRUNUX0lNQUdFU1tpXV0gPSBnZXRGbGFnc09mSW1hZ2UoVFJBTlNFQ1RfSU1BR0VTW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZmlsdGVySXNBY3RpdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmluZGV4T2YoaWQpICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogaWQ6IFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBmbGFnLiBXaWxsIGJlIGFkZGVkIGFzIGNsYXNzIG9mIHRoZSBmbGFnIGVsZW1lbnQgZm9yIGVhY2ggZWxlbWVudFxuICAgICAgICAgKiBpZHM6IElEcyBvZiB0aGUgaW1hZ2VzIHRvIGJlIGZsYWdnZWRcbiAgICAgICAgICogdGl0bGU6IENvbnRlbnQgZm9yIHRoZSB0aXRsZSBwcm9wZXJ0eSBvZiB0aGUgaW1hZ2UgZmxhZyBlbGVtZW50XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChpZCwgaWRzLCB0aXRsZSkge1xuICAgICAgICAgICAgZmxhZ3NbaWRdID0ge1xuICAgICAgICAgICAgICAgIGNzc0NsYXNzOiBpZCxcbiAgICAgICAgICAgICAgICBpZHM6IGlkcyxcbiAgICAgICAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVyOiBmaWx0ZXJJc0FjdGl2ZShpZClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBmbGFnc1tpZF07XG4gICAgICAgICAgICByZW5ld0NhY2hlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJJc0FjdGl2ZShpZCkpIHtcbiAgICAgICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlRmlsdGVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYWN0aXZlRmlsdGVycy5zcGxpY2UoYWN0aXZlRmlsdGVycy5pbmRleE9mKGlkKSwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZsYWdzW2lkXS5hY3RpdmVGaWx0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMucHVzaChpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShhY3RpdmVGaWx0ZXJzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFjdGl2ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3RpdmVGaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGZsYWdzW2FjdGl2ZUZpbHRlcnNbaV1dLmlkcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzQWN0aXZlRmlsdGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGltYWdlc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgbGlzdCBvZiBpbWFnZXMgdG8gZGlzcGxheVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdpbWFnZXMnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgVFJBTlNFQ1RfSUQsIFRSQU5TRUNUX0lNQUdFUywgZmlsdGVyU3Vic2V0LCBmbGFncykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBpbml0aWFsbHkgc2hvd24gaW1hZ2VzXG4gICAgICAgIHZhciBpbml0aWFsTGltaXQgPSAyMDtcblxuICAgICAgICB2YXIgaW1hZ2VzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJztcblxuICAgICAgICB2YXIgb3JkZXJpbmcgPSBbXTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IGRpc3BsYXllZCBvcmRlcmluZyBvZiBpbWFnZXMgKGFzIGFycmF5IG9mIGltYWdlIElEcylcbiAgICAgICAgdGhpcy5zZXF1ZW5jZSA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudGx5IHNob3duIGltYWdlc1xuICAgICAgICB0aGlzLmxpbWl0ID0gaW5pdGlhbExpbWl0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBpbWFnZSBzb3J0aW5nIHNlcXVlbmNlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIF90aGlzLnNlcXVlbmNlID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGltYWdlcyBsb2FkZWQgZnJvbSBzdG9yYWdlIGFyZSBzdGlsbCB0aGVyZSBpbiB0aGUgdHJhbnNlY3QuXG4gICAgICAgICAgICAvLyBzb21lIG9mIHRoZW0gbWF5IGhhdmUgYmVlbiBkZWxldGVkIGluIHRoZSBtZWFudGltZS5cbiAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgVFJBTlNFQ1RfSU1BR0VTLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG51bWJlciBvZiBvdmVyYWxsIGltYWdlc1xuICAgICAgICB0aGlzLmxlbmd0aCA9IHRoaXMuc2VxdWVuY2UubGVuZ3RoO1xuXG4gICAgICAgIHZhciB1cGRhdGVTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcmRlcmluZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCwgbm8gZmlsdGVyaW5nIG5lZWRlZFxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KG9yZGVyaW5nLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgLy8gdGFrZSBvbmx5IHRob3NlIElEcyB0aGF0IGFjdHVhbGx5IGJlbG9uZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAvLyAoZS5nLiB3aGVuIElEcyBhcmUgdGFrZW4gZnJvbSBsb2NhbCBzdG9yYWdlIGJ1dCB0aGUgdHJhbnNlY3QgaGFzIGNoYW5nZWQpXG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IGZsYWdzLmdldEFjdGl2ZUZpbHRlcnMoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBmaWx0ZXJzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMubGVuZ3RoID0gX3RoaXMuc2VxdWVuY2UubGVuZ3RoO1xuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5sZW5ndGggPiAwID8gTWF0aC5taW4oX3RoaXMubGltaXQgLyBfdGhpcy5sZW5ndGgsIDEpIDogMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlb3JkZXIgPSBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICBvcmRlcmluZyA9IEFycmF5LmlzQXJyYXkoaWRzKSA/IGlkcyA6IFtdO1xuICAgICAgICAgICAgdXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICBfdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctb3JkZXJpbmcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZmxhZ3MudG9nZ2xlRmlsdGVyKGlkKTtcbiAgICAgICAgICAgIHVwZGF0ZVNlcXVlbmNlKCk7XG4gICAgICAgICAgICAvLyByZXNldCBsaW1pdFxuICAgICAgICAgICAgX3RoaXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3RyYW5zZWN0cy5pbWFnZXMubmV3LWZpbHRlcmluZycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICBfdGhpcy5saW1pdCArPSBzdGVwO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzZXR0aW5nc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgc2V0dGluZ3Mgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnc2V0dGluZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZXR0aW5nc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy5zZXR0aW5ncyc7XG5cbiAgICAgICAgLy8gY2xpZW50LXNpZGUgKGRlZmF1bHQpIHNldHRpbmdzIGZvciBhbGwgdHJhbnNlY3QgaW5kZXggcGFnZXNcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgICAgJ3Nob3ctZmxhZ3MnOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZXh0ZW5kL292ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBsb2NhbCBvbmVzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc2V0dGluZ3MsIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==