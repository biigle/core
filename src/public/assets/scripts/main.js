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
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.transects').controller('FilterController', ["$scope", "images", "TRANSECT_ID", "TRANSECT_IMAGES", "filter", function ($scope, images, TRANSECT_ID, TRANSECT_IMAGES, filter) {
        "use strict";

        $scope.active = filter.hasRules;

        $scope.data = {
            negate: 'false',
            filter: null,
            selected: null
        };

        $scope.setFilterMode = function (mode) {
            filter.setMode(mode);
            images.updateSequence();
        };

        $scope.isFilterMode = function (mode) {
            return filter.getMode() === mode;
        };

        $scope.getFilters = filter.getAll;

        $scope.addRule = function () {
            // don't simply pass the object on here because it will change in the future
            // the references e.g. to the original filter object should be left intact, though
            var rule = {
                filter: $scope.data.filter,
                negate: $scope.data.negate === 'true',
                data: $scope.data.selected
            };

            // don't allow adding the same rule twice
            if (!filter.hasRule(rule)) {
                filter.addRule(rule).then(images.updateSequence);
            }
        };

        $scope.getRules = filter.getAllRules;

        $scope.removeRule = function (rule) {
            filter.removeRule(rule);
            images.updateSequence();
        };

        $scope.rulesLoading = filter.rulesLoading;

        $scope.numberImages = filter.getNumberImages;

        $scope.selectData = function (data) {
            $scope.data.selected = data;
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
angular.module('dias.transects').controller('ImagesController', ["$scope", "$element", "$timeout", "$q", "images", "filter", function ($scope, $element, $timeout, $q, images, filter) {
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

        $scope.imageHasFlag = filter.hasFlag;

        // timeout to wait for all image objects to be present in the DOM
		$timeout(initialize);
        $scope.$on('transects.images.updated', function () {
            loadStack.length = 0;
            currentlyLoading = 0;
            $timeout(initialize);
        });
	}]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortByFilenameController
 * @memberOf dias.transects
 * @description Controller for sorting images by ID on the transects overview page
 */
angular.module('dias.transects').controller('SortByFilenameController', ["$scope", "sort", "TransectImageOrderByFilename", "TRANSECT_ID", function ($scope, sort, TransectImageOrderByFilename, TRANSECT_ID) {
        "use strict";

        var id = 'filename';

        // cache the sequence here so it is loaded only once
        var sequence;

        $scope.active = function () {
            return sort.isSorterActive('filename');
        };

        $scope.toggle = function () {
            if (!sequence) {
                sequence = TransectImageOrderByFilename.query({transect_id: TRANSECT_ID});
            }

            sequence.$promise.then(function () {
                $scope.activateSorter(id, sequence);
            });
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortByIdController
 * @memberOf dias.transects
 * @description Controller for sorting images by ID on the transects overview page
 */
angular.module('dias.transects').controller('SortByIdController', ["$scope", "sort", "TRANSECT_IMAGES", function ($scope, sort, TRANSECT_IMAGES) {
        "use strict";

        var id = 'id';

        $scope.active = function () {
            return sort.isSorterActive('id');
        };

        $scope.toggle = function () {
            $scope.activateSorter(id, TRANSECT_IMAGES);
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortController
 * @memberOf dias.transects
 * @description Controller for the sorting feature of the transects page
 */
angular.module('dias.transects').controller('SortController', ["$scope", "sort", "images", function ($scope, sort, images) {
        "use strict";

        $scope.active = sort.isActive;

        $scope.setSortAscending = function () {
            sort.setAscending();
            images.updateSequence();
        };

        $scope.setSortDescending = function () {
            sort.setDescending();
            images.updateSequence();
        };

        $scope.isSortAscending = sort.isAscending;
        $scope.isSortDescending = sort.isDescending;

        $scope.activateSorter = function (id, sequence) {
            sort.activateSorter(id, sequence);
            images.updateSequence();
        };

        $scope.resetSorting = function () {
            sort.resetSorting();
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', ["$scope", "images", function ($scope, images) {
		"use strict";

        $scope.progress = function () {
            return {width:  images.progress() * 100 + '%'};
        };
	}]
);

/**
 * @ngdoc factory
 * @name TransectImageOrderByFilename
 * @memberOf dias.transects
 * @description Provides the resource for images of transects, ordered by filename
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the transect with ID 1 ordered by filename
var images = TransectImageOrderByFilename.query({transect_id: 1}, function () {
   console.log(images); // [1, 14, 12, ...]
});
 *
 */
angular.module('dias.transects').factory('TransectImageOrderByFilename', ["$resource", "URL", function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/transects/:transect_id/images/order-by/filename');
}]);

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name filter
 * @memberOf dias.transects
 * @description Service managing the image filter of the transect index page
 */
angular.module('dias.transects').service('filter', ["TRANSECT_ID", "TRANSECT_IMAGES", "filterSubset", "filterExclude", function (TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filterExclude) {
        "use strict";

        var DEFAULT_MODE = 'filter';
        var _this = this;

        var rulesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.filter.rules';
        var modeLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.filter.mode';

        // all available filters for which rules may be added
        var filters = [];

        var mode = window.localStorage.getItem(modeLocalStorageKey);
        if (!mode) {
            mode = DEFAULT_MODE;
        }

        var rules = JSON.parse(window.localStorage.getItem(rulesLocalStorageKey));
        if (!rules) {
            rules = [];
        }

        // the image IDs that should be displayed
        var ids = [];

        var refresh = function () {
            angular.copy(TRANSECT_IMAGES, ids);
            var rule;

            for (var i = rules.length - 1; i >= 0; i--) {
                rule = rules[i];

                if (rule.negate) {
                    filterExclude(ids, rule.ids);
                } else {
                    filterSubset(ids, rule.ids);
                }
            }

            if (rules.length > 0) {
                window.localStorage.setItem(rulesLocalStorageKey, JSON.stringify(rules));
            } else {
                window.localStorage.removeItem(rulesLocalStorageKey);
            }

        };

        this.setMode = function (m) {
            mode = m;
            if (mode !== DEFAULT_MODE) {
                window.localStorage.setItem(modeLocalStorageKey, mode);
            } else {
                window.localStorage.removeItem(modeLocalStorageKey);
            }
        };

        this.getMode = function () {
            return mode;
        };

        this.add = function (newFilter) {
            if (!newFilter.hasOwnProperty('name')) {
                throw "A filter needs a name property";
            }

            if (!newFilter.hasOwnProperty('resource')) {
                throw "A filter needs a resource property";
            }

            filters.push({
                name: newFilter.name,
                resource: newFilter.resource,
                typeahead: newFilter.typeahead,
                // add the transform function or use identity if there is none
                transformData: newFilter.transformData || angular.identity
            });
        };

        this.getAll = function () {
            return filters;
        };

        this.addRule = function (r) {
            var rule = {
                filter: r.filter,
                negate: r.negate,
                data: r.data
            };

            var rollback = function () {
                _this.removeRule(rule);
            };

            var data = r.filter.transformData(r.data);

            rule.ids = r.filter.resource.query({transect_id: TRANSECT_ID, data: data}, refresh, rollback);
            rules.push(rule);

            return rule.ids.$promise;
        };

        this.getAllRules = function () {
            return rules;
        };

        this.removeRule = function (rule) {
            var index = rules.indexOf(rule);
            if (index >= 0) {
                rules.splice(index, 1);
            }

            refresh();
        };

        this.hasRule = function (r) {
            var rule;
            for (var i = rules.length - 1; i >= 0; i--) {
                rule = rules[i];
                if (rule.filter == r.filter && rule.negate == r.negate && rule.data == r.data) {
                    return true;
                }
            }

            return false;
        };

        this.hasRules = function () {
            return rules.length > 0;
        };

        this.rulesLoading = function () {
            for (var i = rules.length - 1; i >= 0; i--) {
                // may be undefined, too, if loaded from local storage
                // undefined means the ids are already loaded
                if (rules[i].ids.$resolved === false) {
                    return true;
                }
            }

            return false;
        };

        this.getNumberImages = function () {
            return ids.length;
        };

        this.getSequence = function () {
            if (mode === 'filter') {
                return ids;
            }

            return TRANSECT_IMAGES;
        };

        this.hasFlag = function (imageId) {
            if (mode === 'flag') {
                return ids.indexOf(imageId) >= 0;
            }

            return false;
        };

        refresh();
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name images
 * @memberOf dias.transects
 * @description Service managing the list of images to display
 */
angular.module('dias.transects').service('images', ["$rootScope", "TRANSECT_ID", "TRANSECT_IMAGES", "filterSubset", "filter", "sort", function ($rootScope, TRANSECT_ID, TRANSECT_IMAGES, filterSubset, filter, sort) {
        "use strict";

        var _this = this;

        // number of initially shown images
        var initialLimit = 20;

        var imagesLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.images';

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

        // number of overall images
        this.length = this.sequence.length;

        this.updateSequence = function () {
            var shouldStore = false;

            if (sort.isActive()) {
                shouldStore = true;
                angular.copy(sort.getSequence(), _this.sequence);
                // take only those IDs that actually belong to the transect
                // (e.g. when IDs are taken from local storage but the transect has changed)
                filterSubset(_this.sequence, TRANSECT_IMAGES, true);
            } else {
                angular.copy(TRANSECT_IMAGES, _this.sequence);
            }

            if (filter.hasRules()) {
                shouldStore = true;
                filterSubset(_this.sequence, filter.getSequence());
            }

            _this.length = _this.sequence.length;

            if (shouldStore) {
                window.localStorage[imagesLocalStorageKey] = JSON.stringify(_this.sequence);
            } else {
                // if there is no special ordering or filtering, the sequence shouldn't be stored
                window.localStorage.removeItem(imagesLocalStorageKey);
            }

            // reset limit
            _this.limit = initialLimit;
            $rootScope.$broadcast('transects.images.updated');
        };

        this.progress = function () {
            return _this.length > 0 ? Math.min(_this.limit / _this.length, 1) : 0;
        };

        this.advance = function (step) {
            _this.limit += step;
        };
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc service
 * @name sort
 * @memberOf dias.transects
 * @description Service managing the image sorting of the transect index page
 */
angular.module('dias.transects').service('sort', ["TRANSECT_ID", "TRANSECT_IMAGES", function (TRANSECT_ID, TRANSECT_IMAGES) {
        "use strict";

        var sorterLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.sorting.sorter';
        var sequenceLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.sorting.sequence';
        var directionLocalStorageKey = 'dias.transects.' + TRANSECT_ID + '.sorting.direction';

        var ASCENDING = 'asc';
        var DESCENDING = 'desc';

        var DEFAULTS = {
            DIRECTION: ASCENDING,
            SORTER: 'id',
            SEQUENCE: TRANSECT_IMAGES
        };

        var direction = window.localStorage.getItem(directionLocalStorageKey);
        if (!direction) {
            direction = DEFAULTS.DIRECTION;
        }

        var sorter = window.localStorage.getItem(sorterLocalStorageKey);
        if (!sorter) {
            sorter = DEFAULTS.SORTER;
        }

        var sequence = JSON.parse(window.localStorage.getItem(sequenceLocalStorageKey));
        if (!sequence) {
            sequence = DEFAULTS.SEQUENCE;
        }

        var updateDirection = function (d) {
            direction = d;
            if (direction === DEFAULTS.DIRECTION) {
                window.localStorage.removeItem(directionLocalStorageKey);
            } else {
                window.localStorage.setItem(directionLocalStorageKey, direction);
            }
        };

        this.setAscending = function () {
            updateDirection(ASCENDING);
        };

        this.setDescending = function () {
            updateDirection(DESCENDING);
        };

        this.isAscending = function () {
            return direction === ASCENDING;
        };

        this.isDescending = function () {
            return direction === DESCENDING;
        };

        this.isSorterActive = function (s) {
            return sorter === s;
        };

        this.isActive = function () {
            return (sorter !== DEFAULTS.SORTER) || (direction !== DEFAULTS.DIRECTION);
        };

        this.resetSorting = function () {
            sorter = DEFAULTS.SORTER;
            window.localStorage.removeItem(sorterLocalStorageKey);
            sequence = DEFAULTS.SEQUENCE;
            window.localStorage.removeItem(sequenceLocalStorageKey);
        };

        this.activateSorter = function (newSorter, newSequence) {
            if (sorter === newSorter) return;

            if (newSequence.length !== DEFAULTS.SEQUENCE.length) {
                throw 'Requested sorting sequence length does not match the number of images in the transect!';
            }

            sorter = newSorter;
            if (sorter === DEFAULTS.SORTER) {
                window.localStorage.removeItem(sorterLocalStorageKey);
            } else {
                window.localStorage.setItem(sorterLocalStorageKey, sorter);
            }

            sequence = newSequence;
            if (sequence === DEFAULTS.SEQUENCE) {
                window.localStorage.removeItem(sequenceLocalStorageKey);
            } else {
                window.localStorage.setItem(sequenceLocalStorageKey, JSON.stringify(sequence));
            }
        };

        this.getSequence = function () {
            if (direction === DESCENDING) {
                // don't alter the original sequence, use slice to copy the array
                return sequence.slice().reverse();
            }

            return sequence;
        };
    }]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2xhenlJbWFnZS5qcyIsImNvbnRyb2xsZXJzL0ZpbHRlckNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JbWFnZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU29ydEJ5RmlsZW5hbWVDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU29ydEJ5SWRDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU29ydENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9UcmFuc2VjdENvbnRyb2xsZXIuanMiLCJmYWN0b3JpZXMvVHJhbnNlY3RJbWFnZU9yZGVyQnlGaWxlbmFtZS5qcyIsInNlcnZpY2VzL2ZpbHRlci5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL3NvcnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxZQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsa0JBQUEsNEJBQUEsVUFBQSxrQkFBQTtJQUNBOztJQUVBLGlCQUFBLGlCQUFBOzs7Ozs7Ozs7O0FDTkEsUUFBQSxPQUFBLGtCQUFBLFVBQUEsb0JBQUEsVUFBQSxJQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOztnQkFFQSxJQUFBLFdBQUEsR0FBQTtnQkFDQSxNQUFBLGFBQUEsU0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxRQUFBLEtBQUEsY0FBQSxTQUFBO29CQUNBLE1BQUEsS0FBQSxPQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7O0FDWEEsUUFBQSxPQUFBLGtCQUFBLFdBQUEscUZBQUEsVUFBQSxRQUFBLFFBQUEsYUFBQSxpQkFBQSxRQUFBO1FBQ0E7O1FBRUEsT0FBQSxTQUFBLE9BQUE7O1FBRUEsT0FBQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLFFBQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLGdCQUFBLFVBQUEsTUFB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dCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG5cbi8qXG4gKiBEaXNhYmxlIGRlYnVnIGluZm8gaW4gcHJvZHVjdGlvbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICogc2VlOiBodHRwczovL2NvZGUuYW5ndWxhcmpzLm9yZy8xLjQuNy9kb2NzL2d1aWRlL3Byb2R1Y3Rpb25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29uZmlnKGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhenlJbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYXp5IGxvYWRpbmcgaW1hZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZGlyZWN0aXZlKCdsYXp5SW1hZ2UnLCBmdW5jdGlvbiAoJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZW5xdWV1ZUltYWdlKGRlZmVycmVkLnByb21pc2UpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2xvYWQgZXJyb3InLCBkZWZlcnJlZC5yZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMuJHNldCgnc3JjJywgYXR0cnMubGF6eUltYWdlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRmlsdGVyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGZpbHRlciBmZWF0dXJlIG9mIHRoZSB0cmFuc2VjdHMgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdGaWx0ZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCBUUkFOU0VDVF9JRCwgVFJBTlNFQ1RfSU1BR0VTLCBmaWx0ZXIpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IGZpbHRlci5oYXNSdWxlcztcblxuICAgICAgICAkc2NvcGUuZGF0YSA9IHtcbiAgICAgICAgICAgIG5lZ2F0ZTogJ2ZhbHNlJyxcbiAgICAgICAgICAgIGZpbHRlcjogbnVsbCxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldEZpbHRlck1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xuICAgICAgICAgICAgZmlsdGVyLnNldE1vZGUobW9kZSk7XG4gICAgICAgICAgICBpbWFnZXMudXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGaWx0ZXJNb2RlID0gZnVuY3Rpb24gKG1vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZ2V0TW9kZSgpID09PSBtb2RlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRGaWx0ZXJzID0gZmlsdGVyLmdldEFsbDtcblxuICAgICAgICAkc2NvcGUuYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIGRvbid0IHNpbXBseSBwYXNzIHRoZSBvYmplY3Qgb24gaGVyZSBiZWNhdXNlIGl0IHdpbGwgY2hhbmdlIGluIHRoZSBmdXR1cmVcbiAgICAgICAgICAgIC8vIHRoZSByZWZlcmVuY2VzIGUuZy4gdG8gdGhlIG9yaWdpbmFsIGZpbHRlciBvYmplY3Qgc2hvdWxkIGJlIGxlZnQgaW50YWN0LCB0aG91Z2hcbiAgICAgICAgICAgIHZhciBydWxlID0ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogJHNjb3BlLmRhdGEuZmlsdGVyLFxuICAgICAgICAgICAgICAgIG5lZ2F0ZTogJHNjb3BlLmRhdGEubmVnYXRlID09PSAndHJ1ZScsXG4gICAgICAgICAgICAgICAgZGF0YTogJHNjb3BlLmRhdGEuc2VsZWN0ZWRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGFsbG93IGFkZGluZyB0aGUgc2FtZSBydWxlIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWZpbHRlci5oYXNSdWxlKHJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyLmFkZFJ1bGUocnVsZSkudGhlbihpbWFnZXMudXBkYXRlU2VxdWVuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRSdWxlcyA9IGZpbHRlci5nZXRBbGxSdWxlcztcblxuICAgICAgICAkc2NvcGUucmVtb3ZlUnVsZSA9IGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgICBmaWx0ZXIucmVtb3ZlUnVsZShydWxlKTtcbiAgICAgICAgICAgIGltYWdlcy51cGRhdGVTZXF1ZW5jZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5ydWxlc0xvYWRpbmcgPSBmaWx0ZXIucnVsZXNMb2FkaW5nO1xuXG4gICAgICAgICRzY29wZS5udW1iZXJJbWFnZXMgPSBmaWx0ZXIuZ2V0TnVtYmVySW1hZ2VzO1xuXG4gICAgICAgICRzY29wZS5zZWxlY3REYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICRzY29wZS5kYXRhLnNlbGVjdGVkID0gZGF0YTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgSW1hZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgZGlzcGxheWluZyB0aGUgaHVnZSBhbW91dCBvZiBpbWFnZXMgb2YgYVxuICogdHJhbnNlY3Qgb24gYSBzaW5nZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdJbWFnZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkcSwgaW1hZ2VzLCBmaWx0ZXIpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBlbGVtZW50ID0gJGVsZW1lbnRbMF07XG5cdFx0dmFyIGJvdW5kaW5nUmVjdCwgdGltZW91dFByb21pc2U7XG5cdFx0Ly8gYWRkIHRoaXMgbWFueSBpbWFnZXMgZm9yIGVhY2ggc3RlcFxuXHRcdHZhciBzdGVwID0gMjA7XG5cdFx0Ly8gb2Zmc2V0IG9mIHRoZSBlbGVtZW50IGJvdHRvbSB0byB0aGUgd2luZG93IGxvd2VyIGJvdW5kIGluIHBpeGVscyBhdFxuXHRcdC8vIHdoaWNoIGEgbmV3IGJ1bmNoIG9mIGltYWdlcyBzaG91bGQgYmUgZGlzcGxheWVkXG5cdFx0dmFyIG5ld1N0ZXBPZmZzZXQgPSAxMDA7XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBsb2FkIGluIHBhcmFsbGVsXG4gICAgICAgIHZhciBwYXJhbGxlbENvbm5lY3Rpb25zID0gMTA7XG4gICAgICAgIC8vIHN0b3JlcyB0aGUgcHJvbWlzZXMgb2YgdGhlIGltYWdlcyB0aGF0IHdhbnQgdG8gbG9hZFxuICAgICAgICB2YXIgbG9hZFN0YWNrID0gW107XG4gICAgICAgIC8vIG51bWJlciBvZiBpbWFnZXMgdGhhdCBhcmUgY3VycmVudGx5IGxvYWRpbmdcbiAgICAgICAgdmFyIGN1cnJlbnRseUxvYWRpbmcgPSAwO1xuXG5cdFx0dmFyIG5lZWRzTmV3U3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGJvdW5kaW5nUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudC5zY3JvbGxUb3AgPj0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIG5ld1N0ZXBPZmZzZXQ7XG5cdFx0fTtcblxuXHRcdHZhciBjaGVja0xvd2VyQm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAobmVlZHNOZXdTdGVwKCkpIHtcbiAgICAgICAgICAgICAgICBpbWFnZXMuYWR2YW5jZShzdGVwKTtcblx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBhdHRlbXB0cyB0byBmaWxsIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpdGggaW1hZ2VzXG5cdFx0Ly8gdXNlcyAkdGltZW91dCB0byB3YWl0IGZvciBET00gcmVuZGVyaW5nLCB0aGVuIGNoZWNrcyBhZ2FpblxuXHRcdHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG5lZWRzTmV3U3RlcCgpICYmIGltYWdlcy5saW1pdCA8PSBpbWFnZXMubGVuZ3RoKSB7XG5cdFx0XHRcdGltYWdlcy5hZHZhbmNlKHN0ZXApO1xuXHRcdFx0XHR0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGluaXRpYWxpemUsIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBpcyBmdWxsLCBub3cgc3dpdGNoIHRvIGV2ZW50IGxpc3RlbmVycyBmb3IgbG9hZGluZ1xuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNoZWNrTG93ZXJCb3VuZCk7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBjaGVja0xvd2VyQm91bmQpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gaW5pdGlhdGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBpZiB0aGVyZSBhcmUgc3RpbGwgdW51c2VkIHBhcmFsbGVsIGNvbm5lY3Rpb25zXG4gICAgICAgIHZhciBtYXliZUxvYWROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRseUxvYWRpbmcgPCBwYXJhbGxlbENvbm5lY3Rpb25zICYmIGxvYWRTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZysrO1xuICAgICAgICAgICAgICAgIGxvYWRTdGFjay5wb3AoKS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIHNob3VsZCBsb2FkXG4gICAgICAgIC8vIGdldHMgYSBwcm9taXNlIGFzIGFyZ2ltZW50IHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2Ugd2FzIGxvYWRlZFxuICAgICAgICAkc2NvcGUuZW5xdWV1ZUltYWdlID0gZnVuY3Rpb24gKGltYWdlTG9hZGVkKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgLy8gYWRkIHRoZSBcInNob3VsZCBsb2FkXCIgcHJvbWlzZSB0byB0aGUgc3RhY2tcbiAgICAgICAgICAgIGxvYWRTdGFjay5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlbnF1ZXVlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgaW1hZ2VMb2FkZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xvYWRlZCcsIGxvYWRTdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIGxvYWQgdGhlIG5leHQgaW1hZ2UgaW4gdGhlIHN0YWNrXG4gICAgICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZy0tO1xuICAgICAgICAgICAgICAgIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUxvYWRpbmcgPT09IDApIG1heWJlTG9hZE5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlSGFzRmxhZyA9IGZpbHRlci5oYXNGbGFnO1xuXG4gICAgICAgIC8vIHRpbWVvdXQgdG8gd2FpdCBmb3IgYWxsIGltYWdlIG9iamVjdHMgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5cdFx0JHRpbWVvdXQoaW5pdGlhbGl6ZSk7XG4gICAgICAgICRzY29wZS4kb24oJ3RyYW5zZWN0cy5pbWFnZXMudXBkYXRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRTdGFjay5sZW5ndGggPSAwO1xuICAgICAgICAgICAgY3VycmVudGx5TG9hZGluZyA9IDA7XG4gICAgICAgICAgICAkdGltZW91dChpbml0aWFsaXplKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTb3J0QnlGaWxlbmFtZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHNvcnRpbmcgaW1hZ2VzIGJ5IElEIG9uIHRoZSB0cmFuc2VjdHMgb3ZlcnZpZXcgcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdTb3J0QnlGaWxlbmFtZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBzb3J0LCBUcmFuc2VjdEltYWdlT3JkZXJCeUZpbGVuYW1lLCBUUkFOU0VDVF9JRCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgaWQgPSAnZmlsZW5hbWUnO1xuXG4gICAgICAgIC8vIGNhY2hlIHRoZSBzZXF1ZW5jZSBoZXJlIHNvIGl0IGlzIGxvYWRlZCBvbmx5IG9uY2VcbiAgICAgICAgdmFyIHNlcXVlbmNlO1xuXG4gICAgICAgICRzY29wZS5hY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc29ydC5pc1NvcnRlckFjdGl2ZSgnZmlsZW5hbWUnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFzZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHNlcXVlbmNlID0gVHJhbnNlY3RJbWFnZU9yZGVyQnlGaWxlbmFtZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlcXVlbmNlLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZVNvcnRlcihpZCwgc2VxdWVuY2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNvcnRCeUlkQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3Igc29ydGluZyBpbWFnZXMgYnkgSUQgb24gdGhlIHRyYW5zZWN0cyBvdmVydmlldyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1NvcnRCeUlkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvcnQsIFRSQU5TRUNUX0lNQUdFUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgaWQgPSAnaWQnO1xuXG4gICAgICAgICRzY29wZS5hY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc29ydC5pc1NvcnRlckFjdGl2ZSgnaWQnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2YXRlU29ydGVyKGlkLCBUUkFOU0VDVF9JTUFHRVMpO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTb3J0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNvcnRpbmcgZmVhdHVyZSBvZiB0aGUgdHJhbnNlY3RzIHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignU29ydENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBzb3J0LCBpbWFnZXMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IHNvcnQuaXNBY3RpdmU7XG5cbiAgICAgICAgJHNjb3BlLnNldFNvcnRBc2NlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzb3J0LnNldEFzY2VuZGluZygpO1xuICAgICAgICAgICAgaW1hZ2VzLnVwZGF0ZVNlcXVlbmNlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldFNvcnREZXNjZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc29ydC5zZXREZXNjZW5kaW5nKCk7XG4gICAgICAgICAgICBpbWFnZXMudXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNTb3J0QXNjZW5kaW5nID0gc29ydC5pc0FzY2VuZGluZztcbiAgICAgICAgJHNjb3BlLmlzU29ydERlc2NlbmRpbmcgPSBzb3J0LmlzRGVzY2VuZGluZztcblxuICAgICAgICAkc2NvcGUuYWN0aXZhdGVTb3J0ZXIgPSBmdW5jdGlvbiAoaWQsIHNlcXVlbmNlKSB7XG4gICAgICAgICAgICBzb3J0LmFjdGl2YXRlU29ydGVyKGlkLCBzZXF1ZW5jZSk7XG4gICAgICAgICAgICBpbWFnZXMudXBkYXRlU2VxdWVuY2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVzZXRTb3J0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc29ydC5yZXNldFNvcnRpbmcoKTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgVHJhbnNlY3RDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ1RyYW5zZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7d2lkdGg6ICBpbWFnZXMucHJvZ3Jlc3MoKSAqIDEwMCArICclJ307XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdEltYWdlT3JkZXJCeUZpbGVuYW1lXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcyBvZiB0cmFuc2VjdHMsIG9yZGVyZWQgYnkgZmlsZW5hbWVcbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IHRoZSBJRHMgb2YgYWxsIGltYWdlcyBvZiB0aGUgdHJhbnNlY3Qgd2l0aCBJRCAxIG9yZGVyZWQgYnkgZmlsZW5hbWVcbnZhciBpbWFnZXMgPSBUcmFuc2VjdEltYWdlT3JkZXJCeUZpbGVuYW1lLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlcyk7IC8vIFsxLCAxNCwgMTIsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZmFjdG9yeSgnVHJhbnNlY3RJbWFnZU9yZGVyQnlGaWxlbmFtZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgIHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzp0cmFuc2VjdF9pZC9pbWFnZXMvb3JkZXItYnkvZmlsZW5hbWUnKTtcbn0pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgZmlsdGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIG1hbmFnaW5nIHRoZSBpbWFnZSBmaWx0ZXIgb2YgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2VcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuc2VydmljZSgnZmlsdGVyJywgZnVuY3Rpb24gKFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMsIGZpbHRlclN1YnNldCwgZmlsdGVyRXhjbHVkZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgREVGQVVMVF9NT0RFID0gJ2ZpbHRlcic7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHJ1bGVzTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuZmlsdGVyLnJ1bGVzJztcbiAgICAgICAgdmFyIG1vZGVMb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5maWx0ZXIubW9kZSc7XG5cbiAgICAgICAgLy8gYWxsIGF2YWlsYWJsZSBmaWx0ZXJzIGZvciB3aGljaCBydWxlcyBtYXkgYmUgYWRkZWRcbiAgICAgICAgdmFyIGZpbHRlcnMgPSBbXTtcblxuICAgICAgICB2YXIgbW9kZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShtb2RlTG9jYWxTdG9yYWdlS2V5KTtcbiAgICAgICAgaWYgKCFtb2RlKSB7XG4gICAgICAgICAgICBtb2RlID0gREVGQVVMVF9NT0RFO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJ1bGVzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0ocnVsZXNMb2NhbFN0b3JhZ2VLZXkpKTtcbiAgICAgICAgaWYgKCFydWxlcykge1xuICAgICAgICAgICAgcnVsZXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBpbWFnZSBJRHMgdGhhdCBzaG91bGQgYmUgZGlzcGxheWVkXG4gICAgICAgIHZhciBpZHMgPSBbXTtcblxuICAgICAgICB2YXIgcmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIGlkcyk7XG4gICAgICAgICAgICB2YXIgcnVsZTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHJ1bGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgcnVsZSA9IHJ1bGVzW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUubmVnYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlckV4Y2x1ZGUoaWRzLCBydWxlLmlkcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KGlkcywgcnVsZS5pZHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJ1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0ocnVsZXNMb2NhbFN0b3JhZ2VLZXksIEpTT04uc3RyaW5naWZ5KHJ1bGVzKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShydWxlc0xvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldE1vZGUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgbW9kZSA9IG07XG4gICAgICAgICAgICBpZiAobW9kZSAhPT0gREVGQVVMVF9NT0RFKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKG1vZGVMb2NhbFN0b3JhZ2VLZXksIG1vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kZUxvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRNb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGQgPSBmdW5jdGlvbiAobmV3RmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIW5ld0ZpbHRlci5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBIGZpbHRlciBuZWVkcyBhIG5hbWUgcHJvcGVydHlcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFuZXdGaWx0ZXIuaGFzT3duUHJvcGVydHkoJ3Jlc291cmNlJykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkEgZmlsdGVyIG5lZWRzIGEgcmVzb3VyY2UgcHJvcGVydHlcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsdGVycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBuZXdGaWx0ZXIubmFtZSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZTogbmV3RmlsdGVyLnJlc291cmNlLFxuICAgICAgICAgICAgICAgIHR5cGVhaGVhZDogbmV3RmlsdGVyLnR5cGVhaGVhZCxcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHRyYW5zZm9ybSBmdW5jdGlvbiBvciB1c2UgaWRlbnRpdHkgaWYgdGhlcmUgaXMgbm9uZVxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybURhdGE6IG5ld0ZpbHRlci50cmFuc2Zvcm1EYXRhIHx8IGFuZ3VsYXIuaWRlbnRpdHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGRSdWxlID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgIHZhciBydWxlID0ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogci5maWx0ZXIsXG4gICAgICAgICAgICAgICAgbmVnYXRlOiByLm5lZ2F0ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiByLmRhdGFcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByb2xsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVSdWxlKHJ1bGUpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIGRhdGEgPSByLmZpbHRlci50cmFuc2Zvcm1EYXRhKHIuZGF0YSk7XG5cbiAgICAgICAgICAgIHJ1bGUuaWRzID0gci5maWx0ZXIucmVzb3VyY2UucXVlcnkoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRCwgZGF0YTogZGF0YX0sIHJlZnJlc2gsIHJvbGxiYWNrKTtcbiAgICAgICAgICAgIHJ1bGVzLnB1c2gocnVsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBydWxlLmlkcy4kcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsbFJ1bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVtb3ZlUnVsZSA9IGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBydWxlcy5pbmRleE9mKHJ1bGUpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICBydWxlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNSdWxlID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgIHZhciBydWxlO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHJ1bGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgcnVsZSA9IHJ1bGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmZpbHRlciA9PSByLmZpbHRlciAmJiBydWxlLm5lZ2F0ZSA9PSByLm5lZ2F0ZSAmJiBydWxlLmRhdGEgPT0gci5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzUnVsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVsZXMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJ1bGVzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBydWxlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIC8vIG1heSBiZSB1bmRlZmluZWQsIHRvbywgaWYgbG9hZGVkIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZCBtZWFucyB0aGUgaWRzIGFyZSBhbHJlYWR5IGxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIChydWxlc1tpXS5pZHMuJHJlc29sdmVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldE51bWJlckltYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpZHMubGVuZ3RoO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VxdWVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gJ2ZpbHRlcicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWRzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gVFJBTlNFQ1RfSU1BR0VTO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzRmxhZyA9IGZ1bmN0aW9uIChpbWFnZUlkKSB7XG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gJ2ZsYWcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkcy5pbmRleE9mKGltYWdlSWQpID49IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWZyZXNoKCk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGltYWdlc1xuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgbGlzdCBvZiBpbWFnZXMgdG8gZGlzcGxheVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdpbWFnZXMnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgVFJBTlNFQ1RfSUQsIFRSQU5TRUNUX0lNQUdFUywgZmlsdGVyU3Vic2V0LCBmaWx0ZXIsIHNvcnQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBudW1iZXIgb2YgaW5pdGlhbGx5IHNob3duIGltYWdlc1xuICAgICAgICB2YXIgaW5pdGlhbExpbWl0ID0gMjA7XG5cbiAgICAgICAgdmFyIGltYWdlc0xvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmltYWdlcyc7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgb3JkZXJpbmcgb2YgaW1hZ2VzIChhcyBhcnJheSBvZiBpbWFnZSBJRHMpXG4gICAgICAgIHRoaXMuc2VxdWVuY2UgPSBbXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnRseSBzaG93biBpbWFnZXNcbiAgICAgICAgdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcblxuICAgICAgICAvLyBjaGVjayBmb3IgYSBzdG9yZWQgaW1hZ2Ugc2VxdWVuY2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgX3RoaXMuc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgaW1hZ2VzIGxvYWRlZCBmcm9tIHN0b3JhZ2UgYXJlIHN0aWxsIHRoZXJlIGluIHRoZSB0cmFuc2VjdC5cbiAgICAgICAgICAgIC8vIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICAgICAgZmlsdGVyU3Vic2V0KF90aGlzLnNlcXVlbmNlLCBUUkFOU0VDVF9JTUFHRVMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5ndWxhci5jb3B5KFRSQU5TRUNUX0lNQUdFUywgX3RoaXMuc2VxdWVuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIG92ZXJhbGwgaW1hZ2VzXG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5zZXF1ZW5jZS5sZW5ndGg7XG5cbiAgICAgICAgdGhpcy51cGRhdGVTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzaG91bGRTdG9yZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoc29ydC5pc0FjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShzb3J0LmdldFNlcXVlbmNlKCksIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAvLyB0YWtlIG9ubHkgdGhvc2UgSURzIHRoYXQgYWN0dWFsbHkgYmVsb25nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gSURzIGFyZSB0YWtlbiBmcm9tIGxvY2FsIHN0b3JhZ2UgYnV0IHRoZSB0cmFuc2VjdCBoYXMgY2hhbmdlZClcbiAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoX3RoaXMuc2VxdWVuY2UsIFRSQU5TRUNUX0lNQUdFUywgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShUUkFOU0VDVF9JTUFHRVMsIF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZpbHRlci5oYXNSdWxlcygpKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkU3RvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChfdGhpcy5zZXF1ZW5jZSwgZmlsdGVyLmdldFNlcXVlbmNlKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5sZW5ndGggPSBfdGhpcy5zZXF1ZW5jZS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmIChzaG91bGRTdG9yZSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbaW1hZ2VzTG9jYWxTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KF90aGlzLnNlcXVlbmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc3BlY2lhbCBvcmRlcmluZyBvciBmaWx0ZXJpbmcsIHRoZSBzZXF1ZW5jZSBzaG91bGRuJ3QgYmUgc3RvcmVkXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGltYWdlc0xvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlc2V0IGxpbWl0XG4gICAgICAgICAgICBfdGhpcy5saW1pdCA9IGluaXRpYWxMaW1pdDtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndHJhbnNlY3RzLmltYWdlcy51cGRhdGVkJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5sZW5ndGggPiAwID8gTWF0aC5taW4oX3RoaXMubGltaXQgLyBfdGhpcy5sZW5ndGgsIDEpIDogMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICAgICAgX3RoaXMubGltaXQgKz0gc3RlcDtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc29ydFxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSBtYW5hZ2luZyB0aGUgaW1hZ2Ugc29ydGluZyBvZiB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5zZXJ2aWNlKCdzb3J0JywgZnVuY3Rpb24gKFRSQU5TRUNUX0lELCBUUkFOU0VDVF9JTUFHRVMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNvcnRlckxvY2FsU3RvcmFnZUtleSA9ICdkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLnNvcnRpbmcuc29ydGVyJztcbiAgICAgICAgdmFyIHNlcXVlbmNlTG9jYWxTdG9yYWdlS2V5ID0gJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuc29ydGluZy5zZXF1ZW5jZSc7XG4gICAgICAgIHZhciBkaXJlY3Rpb25Mb2NhbFN0b3JhZ2VLZXkgPSAnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5zb3J0aW5nLmRpcmVjdGlvbic7XG5cbiAgICAgICAgdmFyIEFTQ0VORElORyA9ICdhc2MnO1xuICAgICAgICB2YXIgREVTQ0VORElORyA9ICdkZXNjJztcblxuICAgICAgICB2YXIgREVGQVVMVFMgPSB7XG4gICAgICAgICAgICBESVJFQ1RJT046IEFTQ0VORElORyxcbiAgICAgICAgICAgIFNPUlRFUjogJ2lkJyxcbiAgICAgICAgICAgIFNFUVVFTkNFOiBUUkFOU0VDVF9JTUFHRVNcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGRpcmVjdGlvbkxvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgIGlmICghZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBERUZBVUxUUy5ESVJFQ1RJT047XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc29ydGVyID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHNvcnRlckxvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgIGlmICghc29ydGVyKSB7XG4gICAgICAgICAgICBzb3J0ZXIgPSBERUZBVUxUUy5TT1JURVI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2VxdWVuY2UgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShzZXF1ZW5jZUxvY2FsU3RvcmFnZUtleSkpO1xuICAgICAgICBpZiAoIXNlcXVlbmNlKSB7XG4gICAgICAgICAgICBzZXF1ZW5jZSA9IERFRkFVTFRTLlNFUVVFTkNFO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVwZGF0ZURpcmVjdGlvbiA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBkO1xuICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gREVGQVVMVFMuRElSRUNUSU9OKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGRpcmVjdGlvbkxvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShkaXJlY3Rpb25Mb2NhbFN0b3JhZ2VLZXksIGRpcmVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRBc2NlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cGRhdGVEaXJlY3Rpb24oQVNDRU5ESU5HKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldERlc2NlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cGRhdGVEaXJlY3Rpb24oREVTQ0VORElORyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pc0FzY2VuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IEFTQ0VORElORztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlzRGVzY2VuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IERFU0NFTkRJTkc7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pc1NvcnRlckFjdGl2ZSA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gc29ydGVyID09PSBzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHNvcnRlciAhPT0gREVGQVVMVFMuU09SVEVSKSB8fCAoZGlyZWN0aW9uICE9PSBERUZBVUxUUy5ESVJFQ1RJT04pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVzZXRTb3J0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc29ydGVyID0gREVGQVVMVFMuU09SVEVSO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHNvcnRlckxvY2FsU3RvcmFnZUtleSk7XG4gICAgICAgICAgICBzZXF1ZW5jZSA9IERFRkFVTFRTLlNFUVVFTkNFO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHNlcXVlbmNlTG9jYWxTdG9yYWdlS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFjdGl2YXRlU29ydGVyID0gZnVuY3Rpb24gKG5ld1NvcnRlciwgbmV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3J0ZXIgPT09IG5ld1NvcnRlcikgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobmV3U2VxdWVuY2UubGVuZ3RoICE9PSBERUZBVUxUUy5TRVFVRU5DRS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnUmVxdWVzdGVkIHNvcnRpbmcgc2VxdWVuY2UgbGVuZ3RoIGRvZXMgbm90IG1hdGNoIHRoZSBudW1iZXIgb2YgaW1hZ2VzIGluIHRoZSB0cmFuc2VjdCEnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3J0ZXIgPSBuZXdTb3J0ZXI7XG4gICAgICAgICAgICBpZiAoc29ydGVyID09PSBERUZBVUxUUy5TT1JURVIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oc29ydGVyTG9jYWxTdG9yYWdlS2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHNvcnRlckxvY2FsU3RvcmFnZUtleSwgc29ydGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VxdWVuY2UgPSBuZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIGlmIChzZXF1ZW5jZSA9PT0gREVGQVVMVFMuU0VRVUVOQ0UpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oc2VxdWVuY2VMb2NhbFN0b3JhZ2VLZXkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oc2VxdWVuY2VMb2NhbFN0b3JhZ2VLZXksIEpTT04uc3RyaW5naWZ5KHNlcXVlbmNlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IERFU0NFTkRJTkcpIHtcbiAgICAgICAgICAgICAgICAvLyBkb24ndCBhbHRlciB0aGUgb3JpZ2luYWwgc2VxdWVuY2UsIHVzZSBzbGljZSB0byBjb3B5IHRoZSBhcnJheVxuICAgICAgICAgICAgICAgIHJldHVybiBzZXF1ZW5jZS5zbGljZSgpLnJldmVyc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlcXVlbmNlO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
