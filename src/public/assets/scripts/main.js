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
            return length > 0 ? Math.min(_this.limit / length, 1) : 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvVHJhbnNlY3RDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYXp5SW1hZ2UuanMiLCJzZXJ2aWNlcy9mbGFncy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGtCQUFBLENBQUEsWUFBQTs7Ozs7Ozs7OztBQ0lBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLHVFQUFBLFVBQUEsUUFBQSxVQUFBLFVBQUEsSUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFNBQUE7RUFDQSxJQUFBLGNBQUE7O0VBRUEsSUFBQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBOztRQUVBLElBQUEsc0JBQUE7O1FBRUEsSUFBQSxZQUFBOztRQUVBLElBQUEsbUJBQUE7O0VBRUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxlQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsYUFBQSxRQUFBLGVBQUEsUUFBQSxlQUFBOzs7RUFHQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLGdCQUFBO2dCQUNBLE9BQUEsUUFBQTtJQUNBLE9BQUE7Ozs7OztFQU1BLElBQUEsYUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQTtJQUNBLE9BQUEsUUFBQTtJQUNBLGlCQUFBLFNBQUEsWUFBQTtVQUNBOztJQUVBLFNBQUEsT0FBQTtJQUNBLFFBQUEsaUJBQUEsVUFBQTtJQUNBLE9BQUEsaUJBQUEsVUFBQTs7Ozs7UUFLQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLHVCQUFBLFVBQUEsU0FBQSxHQUFBO2dCQUNBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7OztRQU9BLE9BQUEsZUFBQSxVQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTs7WUFFQSxVQUFBLEtBQUE7O1lBRUEsWUFBQSxLQUFB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LEtBQUEsTUFBQSxVQUFBLEtBQUE7WUFDQSxPQUFBLFNBQUE7Ozs7QUFJQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdHJhbnNlY3RzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSwgaW1hZ2VzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuXHRcdHZhciBib3VuZGluZ1JlY3QsIHRpbWVvdXRQcm9taXNlO1xuXHRcdC8vIGFkZCB0aGlzIG1hbnkgaW1hZ2VzIGZvciBlYWNoIHN0ZXBcblx0XHR2YXIgc3RlcCA9IDIwO1xuXHRcdC8vIG9mZnNldCBvZiB0aGUgZWxlbWVudCBib3R0b20gdG8gdGhlIHdpbmRvdyBsb3dlciBib3VuZCBpbiBwaXhlbHMgYXRcblx0XHQvLyB3aGljaCBhIG5ldyBidW5jaCBvZiBpbWFnZXMgc2hvdWxkIGJlIGRpc3BsYXllZFxuXHRcdHZhciBuZXdTdGVwT2Zmc2V0ID0gMTAwO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gbG9hZCBpbiBwYXJhbGxlbFxuICAgICAgICB2YXIgcGFyYWxsZWxDb25uZWN0aW9ucyA9IDEwO1xuICAgICAgICAvLyBzdG9yZXMgdGhlIHByb21pc2VzIG9mIHRoZSBpbWFnZXMgdGhhdCB3YW50IHRvIGxvYWRcbiAgICAgICAgdmFyIGxvYWRTdGFjayA9IFtdO1xuICAgICAgICAvLyBudW1iZXIgb2YgaW1hZ2VzIHRoYXQgYXJlIGN1cnJlbnRseSBsb2FkaW5nXG4gICAgICAgIHZhciBjdXJyZW50bHlMb2FkaW5nID0gMDtcblxuXHRcdHZhciBuZWVkc05ld1N0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRib3VuZGluZ1JlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0cmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wID49IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSBuZXdTdGVwT2Zmc2V0O1xuXHRcdH07XG5cblx0XHR2YXIgY2hlY2tMb3dlckJvdW5kID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzLmFkdmFuY2Uoc3RlcCk7XG5cdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gYXR0ZW1wdHMgdG8gZmlsbCB0aGUgY3VycmVudCB2aWV3cG9ydCB3aXRoIGltYWdlc1xuXHRcdC8vIHVzZXMgJHRpbWVvdXQgdG8gd2FpdCBmb3IgRE9NIHJlbmRlcmluZywgdGhlbiBjaGVja3MgYWdhaW5cblx0XHR2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChuZWVkc05ld1N0ZXAoKSkge1xuXHRcdFx0XHRpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0dGltZW91dFByb21pc2UgPSAkdGltZW91dChpbml0aWFsaXplLCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdmlld3BvcnQgaXMgZnVsbCwgbm93IHN3aXRjaCB0byBldmVudCBsaXN0ZW5lcnMgZm9yIGxvYWRpbmdcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tMb3dlckJvdW5kKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGluaXRpYXRlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgaWYgdGhlcmUgYXJlIHN0aWxsIHVudXNlZCBwYXJhbGxlbCBjb25uZWN0aW9uc1xuICAgICAgICB2YXIgbWF5YmVMb2FkTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50bHlMb2FkaW5nIDwgcGFyYWxsZWxDb25uZWN0aW9ucyAmJiBsb2FkU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRseUxvYWRpbmcrKztcbiAgICAgICAgICAgICAgICBsb2FkU3RhY2sucG9wKCkucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobG9hZFN0YWNrLmxlbmd0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHNob3VsZCBsb2FkXG4gICAgICAgIC8vIGdldHMgYSBwcm9taXNlIGFzIGFyZ2ltZW50IHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAkc2NvcGUuZW5xdWV1ZUltYWdlID0gZnVuY3Rpb24gKGltYWdlTG9hZGVkKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgLy8gYWRkIHRoZSBcInNob3VsZCBsb2FkXCIgcHJvbWlzZSB0byB0aGUgc3RhY2tcbiAgICAgICAgICAgIGxvYWRTdGFjay5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlbnF1ZXVlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgaW1hZ2VMb2FkZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xvYWRlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIGxvYWQgdGhlIG5leHQgaW1hZ2UgaW4gdGhlIHN0YWNrXG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZy0tO1xuICAgICAgICAgICAgICAgIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUxvYWRpbmcgPT09IDApIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG5cbiAgICAgICAgLy8gdGltZW91dCB0byB3YWl0IGZvciBhbGwgaW1hZ2Ugb2JqZWN0cyB0byBiZSBwcmVzZW50IGluIHRoZSBET01cblx0XHQkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgJHNjb3BlLiRvbigndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBUcmFuc2VjdENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignVHJhbnNlY3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCBzZXR0aW5ncywgZmxhZ3MpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSBzZXR0aW5ncztcblxuICAgICAgICAkc2NvcGUuZmxhZ3MgPSBmbGFncztcblxuICAgICAgICAkc2NvcGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3dpZHRoOiAgaW1hZ2VzLnByb2dyZXNzKCkgKiAxMDAgKyAnJSd9O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNldCB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpc3BsYXllZCBpbWFnZXNcbiAgICAgICAgJHNjb3BlLnNldEltYWdlc1NlcXVlbmNlID0gZnVuY3Rpb24gKHNlcXVlbmNlKSB7XG4gICAgICAgICAgICBpbWFnZXMucmVvcmRlcihzZXF1ZW5jZSk7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy5uZXctc2VxdWVuY2UnKTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGF6eUltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhenkgbG9hZGluZyBpbWFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5kaXJlY3RpdmUoJ2xhenlJbWFnZScsIGZ1bmN0aW9uICgkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSB3YXMgbG9hZGVkXG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBzY29wZS5lbnF1ZXVlSW1hZ2UoZGVmZXJyZWQucHJvbWlzZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYmluZCgnbG9hZCBlcnJvcicsIGRlZmVycmVkLnJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICBhdHRycy4kc2V0KCdzcmMnLCBhdHRycy5sYXp5SW1hZ2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBmbGFnc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgaW1hZ2UgZmxhZ3Mgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnZmxhZ3MnLCBmdW5jdGlvbiAoVFJBTlNFQ1RfSUQsIFRSQU5TRUNUX0lNQUdFUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYWN0aXZlRmlsdGVyc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmFjdGl2ZV9maWx0ZXJzJztcblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZmxhZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5saXN0ID0gZmxhZ3M7XG5cbiAgICAgICAgLy8gY2FjaGVzIGEgbWFwIG9mIGFsbCBmbGFncyBmb3IgYWxsIGltYWdlcyBvZiB0aGUgdHJhbnNlY3RcbiAgICAgICAgdGhpcy5jYWNoZSA9IHt9O1xuXG4gICAgICAgIHZhciBhY3RpdmVGaWx0ZXJzID0gW107XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgc3RvcmVkIGFjdGl2ZSBmaWx0ZXJzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICBhY3RpdmVGaWx0ZXJzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXRGbGFnc09mSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGZsYWdJZCBpbiBmbGFncykge1xuICAgICAgICAgICAgICAgIGlmIChmbGFnc1tmbGFnSWRdLmlkcy5pbmRleE9mKGlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZmxhZ3NbZmxhZ0lkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZW5ld0NhY2hlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5jYWNoZVtUUkFOU0VDVF9JTUFHRVNbaV1dID0gZ2V0RmxhZ3NPZkltYWdlKFRSQU5TRUNUX0lNQUdFU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlcklzQWN0aXZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVycy5pbmRleE9mKGlkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGlkOiBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZmxhZy4gV2lsbCBiZSBhZGRlZCBhcyBjbGFzcyBvZiB0aGUgZmxhZyBlbGVtZW50IGZvciBlYWNoIGVsZW1lbnRcbiAgICAgICAgICogaWRzOiBJRHMgb2YgdGhlIGltYWdlcyB0byBiZSBmbGFnZ2VkXG4gICAgICAgICAqIHRpdGxlOiBDb250ZW50IGZvciB0aGUgdGl0bGUgcHJvcGVydHkgb2YgdGhlIGltYWdlIGZsYWcgZWxlbWVudFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hZGQgPSBmdW5jdGlvbiAoaWQsIGlkcywgdGl0bGUpIHtcbiAgICAgICAgICAgIGZsYWdzW2lkXSA9IHtcbiAgICAgICAgICAgICAgICBjc3NDbGFzczogaWQsXG4gICAgICAgICAgICAgICAgaWRzOiBpZHMsXG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgICAgIGFjdGl2ZUZpbHRlcjogZmlsdGVySXNBY3RpdmUoaWQpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVuZXdDYWNoZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBkZWxldGUgZmxhZ3NbaWRdO1xuICAgICAgICAgICAgcmVuZXdDYWNoZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9nZ2xlRmlsdGVyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVySXNBY3RpdmUoaWQpKSB7XG4gICAgICAgICAgICAgICAgZmxhZ3NbaWRdLmFjdGl2ZUZpbHRlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGFjdGl2ZUZpbHRlcnMuc3BsaWNlKGFjdGl2ZUZpbHRlcnMuaW5kZXhPZihpZCksIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmbGFnc1tpZF0uYWN0aXZlRmlsdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhY3RpdmVGaWx0ZXJzLnB1c2goaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2FjdGl2ZUZpbHRlcnNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoYWN0aXZlRmlsdGVycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBY3RpdmVGaWx0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aXZlRmlsdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZpbHRlcnMucHVzaChmbGFnc1thY3RpdmVGaWx0ZXJzW2ldXS5pZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVycztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc0FjdGl2ZUZpbHRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVycy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgbWFuYWdpbmcgdGhlIGxpc3Qgb2YgaW1hZ2VzIHRvIGRpc3BsYXlcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMsIGZpbHRlclN1YnNldCwgZmxhZ3MpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBudW1iZXIgb2YgaW5pdGlhbGx5IHNob3duIGltYWdlc1xuICAgICAgICB2YXIgaW5pdGlhbExpbWl0ID0gMjA7XG5cbiAgICAgICAgdmFyIGltYWdlc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmltYWdlcyc7XG5cbiAgICAgICAgdmFyIG9yZGVyaW5nID0gW107XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgIHRoaXMuc2VxdWVuY2UgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgLy8gbnVtYmVyIG9mIG92ZXJhbGwgaW1hZ2VzXG4gICAgICAgIHZhciBsZW5ndGggPSBUUkFOU0VDVF9JTUFHRVMubGVuZ3RoO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBhIHN0b3JlZCBpbWFnZSBzb3J0aW5nIHNlcXVlbmNlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgIF90aGlzLnNlcXVlbmNlID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2ltYWdlc0xvY2FsU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGltYWdlcyBsb2FkZWQgZnJvbSBzdG9yYWdlIGFyZSBzdGlsbCB0aGVyZSBpbiB0aGUgdHJhbnNlY3QuXG4gICAgICAgICAgICAvLyBzb21lIG9mIHRoZW0gbWF5IGhhdmUgYmVlbiBkZWxldGVkIGluIHRoZSBtZWFudGltZS5cbiAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgVFJBTlNFQ1RfSU1BR0VTLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1cGRhdGVTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcmRlcmluZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCwgbm8gZmlsdGVyaW5nIG5lZWRlZFxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KG9yZGVyaW5nLCBfdGhpcy5zZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgLy8gdGFrZSBvbmx5IHRob3NlIElEcyB0aGF0IGFjdHVhbGx5IGJlbG9uZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAvLyAoZS5nLiB3aGVuIElEcyBhcmUgdGFrZW4gZnJvbSBsb2NhbCBzdG9yYWdlIGJ1dCB0aGUgdHJhbnNlY3QgaGFzIGNoYW5nZWQpXG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IGZsYWdzLmdldEFjdGl2ZUZpbHRlcnMoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBmaWx0ZXJzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtpbWFnZXNMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVuZ3RoID4gMCA/IE1hdGgubWluKF90aGlzLmxpbWl0IC8gbGVuZ3RoLCAxKSA6IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW9yZGVyID0gZnVuY3Rpb24gKGlkcykge1xuICAgICAgICAgICAgb3JkZXJpbmcgPSBBcnJheS5pc0FycmF5KGlkcykgPyBpZHMgOiBbXTtcbiAgICAgICAgICAgIHVwZGF0ZVNlcXVlbmNlKCk7XG4gICAgICAgICAgICAvLyByZXNldCBsaW1pdFxuICAgICAgICAgICAgX3RoaXMubGltaXQgPSBpbml0aWFsTGltaXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZsYWdzLnRvZ2dsZUZpbHRlcihpZCk7XG4gICAgICAgICAgICB1cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICBfdGhpcy5saW1pdCArPSBzdGVwO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzZXR0aW5nc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgc2V0dGluZ3Mgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnc2V0dGluZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZXR0aW5nc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy5zZXR0aW5ncyc7XG5cbiAgICAgICAgLy8gY2xpZW50LXNpZGUgKGRlZmF1bHQpIHNldHRpbmdzIGZvciBhbGwgdHJhbnNlY3QgaW5kZXggcGFnZXNcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgICAgJ3Nob3ctZmxhZ3MnOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZXh0ZW5kL292ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBsb2NhbCBvbmVzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc2V0dGluZ3MsIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc0xvY2FsU3RvcmFnZUtleV0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NMb2NhbFN0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==